// multi-user-template — local performer-driven server.
//
// Loaded by [node.script server.js] in multi-user-template.maxpat. The patch
// hosts an HTTP + WebSocket server on the LAN; phones visit the URL, enter a
// name, optionally take an admin password to unlock the admin role, sit in
// the lobby until an admin starts the piece, then stream every available
// phone sensor (motion, orientation, geolocation, mic level, multitouch,
// battery, network) back. The server fans the high-rate streams out as OSC
// over UDP to a [udpreceive] in Max for sample-accurate control, and emits
// the discrete events (joins, role changes, transport) as Max.outlet
// messages routed by selector.
//
// Outlets (single node.script outlet; route in the patch by leading symbol):
//   performer add <name>            — new joiner
//   performer remove <name>         — left or kicked
//   performer roles <name> <r1> <r2> — current role set (space-separated)
//   roster <name1> <name2> ...      — full ordered roster
//   status <text>                   — human-readable status line
//   url <http://...>                — server URL
//   started <0|1>                   — transport state
//   admincount <n>                  — number of authenticated admins
//   sensor <name> <kind> ...        — sensor / control sample. Kinds:
//                                       motion gyro orient heading geo mic
//                                       touch pointer gamepad button slider
//                                       dial key text midi battery net light
//                                       gravity linaccel magnet pressure
//                                       proximity screen speech
//                                     — also forwarded as OSC over UDP.
//
// Inbound from the patch (Max → phones):
//   vibrate <ms>            broadcast — every connected phone buzzes
//   vibrateto <name> <ms>   directed
//   speak <text...>         broadcast — TTS via Web Speech Synthesis
//   speakto <name> <text...>
//   beep <freq> <ms>        broadcast — short oscillator beep
//   beepto <name> <freq> <ms>
//   display <text...>       broadcast — show text on the Output tab
//   displayto <name> <text...>
//   synthnote <note> <vel>  broadcast — trigger the on-phone synth voice
//   synthnoteto <name> <note> <vel>
//   synthset <param> <value>          broadcast — set a synth parameter
//   synthsetto <name> <param> <value> directed
//   synthmode <mode>                  broadcast — switch engine: osc fm wavetable sample
//   synthmodeto <name> <mode>

const http = require("http");
const fs   = require("fs");
const path = require("path");
const os   = require("os");

let Max     = null;
let WSServer = null;
let osc     = null;
try { Max = require("max-api"); }
catch (e) {
  Max = {
    post:    (...a) => console.log("[max.post]", ...a),
    outlet:  (...a) => console.log("[max.out ]", ...a),
    addHandler: () => {},
    MESSAGE_TYPES: { ALL: "all" }
  };
}
try { WSServer = require("ws").WebSocketServer; }
catch (e) {
  console.error("ws module not installed. Run `npm install` in this folder.");
  Max.post && Max.post("ws module missing — run npm install", "error");
}
try { osc = require("osc"); }
catch (e) {
  console.error("osc module not installed. Run `npm install` in this folder.");
  Max.post && Max.post("osc module missing — sensor streams will not reach Max via UDP. Run npm install.", "error");
}

// ── config (settable from the patch) ──────────────────────────────

const cfg = {
  port:        8080,
  oscHost:     "127.0.0.1",
  oscPort:     7400,
  password:    "",                          // admin password — empty disables admin
  roles:       ["role1", "role2", "role3"], // non-admin roles; admin is implicit
  tickMs:      1000
};

const ADMIN_ROLE = "admin";

// ── state ────────────────────────────────────────────────────────

// performers: name → record. Name is the stable identity key — reconnects
// under the same name resume the existing record (admin auth, roles, etc.).
const performers = new Map();
// name → WebSocket
const sockets    = new Map();

function freshPerformer(name) {
  return {
    name,
    roles:     new Set(),  // chosen role names (subset of cfg.roles ∪ {admin})
    isAdmin:   false,      // requires password
    connected: false,
    joinedAt:  Date.now(),
    // "lan"    — joined over the LAN HTTP+WS server (this same process)
    // "remote" — joined via the cloud relay (no direct ws here; messages
    //            are bridged through cloudWs by `to: <name>`)
    kind:      "lan",
    // Per-kind summary of the latest sensor sample, used to populate the
    // monitor cellblock without re-deriving from history. Each entry is a
    // short pre-formatted string ready to drop into a cell.
    lastSensors:    {},
    lastSensorTime: 0
  };
}

// One column per data stream we want the patch operator to see at a
// glance. Order is fixed; pushMonitor writes one row per performer using
// these indices. Add a column here AND a corresponding update inside
// handleSensor's case for that kind.
const MONITOR_COLS = [
  "Name", "Conn", "Roles",
  "Motion", "Orient", "Head",
  "Geo", "Mic", "Touch",
  "Btn", "Slid", "Dial", "MIDI",
  "Batt", "Speech", "Upd"
];

function recordSensor(name, kind, summary) {
  const p = performers.get(name);
  if (!p) return;
  p.lastSensors[kind]  = String(summary).slice(0, 64);
  p.lastSensorTime     = Date.now();
  schedMonitor();
}

let monitorPending = false;
function schedMonitor() {
  // Coalesce rapid sensor updates into one cellblock repaint at ~4 Hz.
  // Without this, a 16 Hz motion stream from 10 performers fires 160
  // cell-rewrites per second at Max — visible flicker AND wasted work.
  if (monitorPending) return;
  monitorPending = true;
  setTimeout(() => { monitorPending = false; pushMonitor(); }, 250);
}

function pushMonitor() {
  const names = Array.from(performers.keys());
  const rows  = names.length + 1;   // +1 header
  Max.outlet("monitor", "rows", rows);
  Max.outlet("monitor", "cols", MONITOR_COLS.length);
  Max.outlet("monitor", "clear");
  // Column widths — Name and Roles get more room; everything else equal.
  Max.outlet("monitor", "col", 0, "width", 110);
  Max.outlet("monitor", "col", 1, "width", 56);
  Max.outlet("monitor", "col", 2, "width", 100);
  for (let c = 3; c < MONITOR_COLS.length; c++) {
    Max.outlet("monitor", "col", c, "width", 70);
  }
  // Header row.
  MONITOR_COLS.forEach((label, c) => Max.outlet("monitor", "set", c, 0, label));
  // Data rows.
  const now = Date.now();
  names.forEach((n, i) => {
    const p   = performers.get(n);
    const r   = i + 1;
    const ls  = p.lastSensors || {};
    const conn = !p.connected ? "off" : (p.kind === "remote" ? "remote" : "lan");
    const roles = Array.from(p.roles).join(",") || "—";
    const upd   = p.lastSensorTime ? `${Math.round((now - p.lastSensorTime) / 100) / 10}s` : "";
    Max.outlet("monitor", "set",  0, r, n);
    Max.outlet("monitor", "set",  1, r, conn);
    Max.outlet("monitor", "set",  2, r, roles);
    Max.outlet("monitor", "set",  3, r, ls.motion   || "");
    Max.outlet("monitor", "set",  4, r, ls.orient   || "");
    Max.outlet("monitor", "set",  5, r, ls.heading  || "");
    Max.outlet("monitor", "set",  6, r, ls.geo      || "");
    Max.outlet("monitor", "set",  7, r, ls.mic      || "");
    Max.outlet("monitor", "set",  8, r, ls.touch    || "");
    Max.outlet("monitor", "set",  9, r, ls.button   || "");
    Max.outlet("monitor", "set", 10, r, ls.slider   || "");
    Max.outlet("monitor", "set", 11, r, ls.dial     || "");
    Max.outlet("monitor", "set", 12, r, ls.midi     || "");
    Max.outlet("monitor", "set", 13, r, ls.battery  || "");
    Max.outlet("monitor", "set", 14, r, ls.speech   || "");
    Max.outlet("monitor", "set", 15, r, upd);
  });
}

// Transport: false = lobby; true = piece running. No count-in here — the
// template stays minimal; pieces that want one can layer it in Max.
let started = false;

// Heartbeat keeps us honest about who is actually connected. ws.on("close")
// only fires on a clean TCP close; a phone in airplane mode or with a hung
// network stack leaves the server-side socket "open" forever without this.
// Worst-case phantom detection time is 2 × HEARTBEAT_MS.
const HEARTBEAT_MS = 15000;
let heartbeatTimer = null;
let tickTimer      = null;

// ── ip discovery (for the URL printed in the patch / handed to phones) ──

function lanIp() {
  const ifs = os.networkInterfaces();
  const candidates = [];
  Object.keys(ifs).forEach(k => {
    (ifs[k] || []).forEach(addr => {
      if (addr.family === "IPv4" && !addr.internal) {
        candidates.push({ name: k, addr: addr.address });
      }
    });
  });
  if (candidates.length === 0) return "127.0.0.1";
  candidates.sort((a, b) => (a.name.startsWith("en") ? 0 : 1) - (b.name.startsWith("en") ? 0 : 1));
  return candidates[0].addr;
}

function publicUrl() { return `http://${lanIp()}:${cfg.port}/`; }

// ── osc fan-out ─────────────────────────────────────────────────

let oscUdp = null;

function startOsc() {
  if (!osc) return;
  try {
    oscUdp = new osc.UDPPort({
      localAddress: "0.0.0.0",
      localPort:    0,                 // ephemeral — we only send
      remoteAddress: cfg.oscHost,
      remotePort:    cfg.oscPort,
      metadata: false
    });
    oscUdp.on("error", (err) => Max.post(`OSC error: ${err.message}`, "error"));
    oscUdp.open();
    Max.post(`OSC fan-out → ${cfg.oscHost}:${cfg.oscPort}`);
  } catch (e) {
    Max.post(`OSC start failed: ${e.message}`, "error");
    oscUdp = null;
  }
}

function stopOsc() {
  if (oscUdp) {
    try { oscUdp.close(); } catch (_) {}
    oscUdp = null;
  }
}

// OSC address sanitization: names go straight into the address path so they
// must be safe for the OSC pattern grammar. Replace anything outside
// [A-Za-z0-9_-] with '_'. The display roster still carries the original
// name — only the OSC address is sanitized.
function oscSafe(s) { return String(s).replace(/[^A-Za-z0-9_\-]/g, "_"); }

function sendOsc(address, args) {
  if (!oscUdp) return;
  try { oscUdp.send({ address, args }); } catch (e) { /* best-effort */ }
}

// ── http server ────────────────────────────────────────────────

const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".ico":  "image/x-icon"
};

function serveStatic(req, res) {
  let urlPath = req.url.split("?")[0];
  if (urlPath === "/" || urlPath === "") urlPath = "/index.html";
  if (urlPath.indexOf("..") !== -1) { res.writeHead(400); res.end("bad path"); return; }
  const full = path.join(PUBLIC_DIR, urlPath);
  fs.readFile(full, (err, buf) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    const ext = path.extname(full).toLowerCase();
    // No-cache: every page load must hit the server. iOS Safari is otherwise
    // happy to serve a stale index.html / JS bundle from disk, and different
    // phones end up running different versions of the lobby at the same time.
    res.writeHead(200, {
      "Content-Type":  MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma":        "no-cache",
      "Expires":       "0"
    });
    res.end(buf);
  });
}

// Fresh http + wss instances per startServer() — `.listen()` after `.close()`
// is unreliable across Node versions, so we don't rely on it.
let httpServer = null;
let wss        = null;

function createHttpServer() {
  return http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        ok: true,
        performers: performers.size,
        started,
        roles: cfg.roles,
        adminEnabled: cfg.password.length > 0
      }));
      return;
    }
    serveStatic(req, res);
  });
}

function attachWsHandlers(ws) {
  ws.isAlive = true;
  ws.on("pong",   () => { ws.isAlive = true; });
  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(String(raw)); } catch (_) { return; }
    handleClientMessage(ws, msg);
  });
  ws.on("close", () => {
    // The orphaned-socket case (duplicate-name join overwrote `sockets[name]`
    // before this old socket's close fired) shows up as no match in the loop —
    // we correctly skip disconnect for that case.
    let goneName = null;
    sockets.forEach((sock, name) => { if (sock === ws) goneName = name; });
    if (goneName) disconnectPerformer(goneName);
  });
  sendTo(ws, snapshotFor(null));
}

function heartbeat() {
  if (!wss) return;
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) { try { ws.terminate(); } catch (_) {} return; }
    ws.isAlive = false;
    try { ws.ping(); } catch (_) {}
  });
}

// ── client message dispatch ────────────────────────────────────

function handleClientMessage(ws, msg) {
  if (!msg || !msg.type) return;
  const type = msg.type;
  // Sensor streams come through hot — handle them up front to keep latency
  // low and avoid touching the slower broadcast path.
  if (type === "sensor") {
    const name = nameForSocket(ws);
    if (name) handleSensor(name, msg);
    return;
  }

  if (type === "join") {
    const name = String(msg.name || "").trim();
    if (!name) { sendTo(ws, { type: "error", message: "name required" }); return; }
    addPerformer(name, ws);
    sendTo(ws, { type: "joined", name });
  }
  else if (type === "roles") {
    const name = nameForSocket(ws);
    if (!name || !performers.has(name)) return;
    const wanted = Array.isArray(msg.roles) ? msg.roles.map(String) : [];
    const password = String(msg.password || "");
    applyRoles(name, wanted, password);
  }
  else if (type === "leave") {
    const name = nameForSocket(ws);
    if (name) removePerformer(name);
  }
  else if (type === "start") {
    // Only authenticated admins can start the piece. Same gate from the
    // patch's START button bypasses this entirely.
    const name = nameForSocket(ws);
    const p    = name && performers.get(name);
    if (!p || !p.isAdmin) { sendTo(ws, { type: "error", message: "admin required" }); return; }
    beginPiece();
  }
  else if (type === "stop") {
    const name = nameForSocket(ws);
    const p    = name && performers.get(name);
    if (!p || !p.isAdmin) { sendTo(ws, { type: "error", message: "admin required" }); return; }
    stopPiece();
  }
  broadcastSnapshot();
}

function nameForSocket(ws) {
  let found = null;
  sockets.forEach((s, name) => { if (s === ws) found = name; });
  return found;
}

// ── sensor ingest + osc fan-out ────────────────────────────────

// Stage gate: sensor streams are only accepted once the piece has started
// AND from clients whose role set is non-empty. Otherwise a lobby tab could
// firehose motion data into Max before anyone is supposed to be performing.
//
// Takes the performer's name directly (not a ws) so both LAN-direct and
// cloud-relayed performers go through the same path.
function handleSensor(name, msg) {
  if (!started) return;
  const p = performers.get(name);
  if (!p || p.roles.size === 0) return;

  const kind = String(msg.kind || "");
  const safe = oscSafe(name);

  // For each sensor kind we forward to:
  //   1. Max.outlet("sensor", name, kind, ...values)  — for low-volume,
  //      discrete events you want to route by selector in the patch.
  //   2. OSC /user/<name>/<kind>[/<sub>] over UDP    — for high-rate
  //      streams that should land in [udpreceive].
  // Both paths run for every sample; the patch can ignore whichever it
  // doesn't need. (For very-high-rate streams you'll likely want to use OSC
  // and leave the Max.outlet path off — see README.)
  switch (kind) {
    case "motion": {
      const ax = numOr0(msg.ax), ay = numOr0(msg.ay), az = numOr0(msg.az);
      Max.outlet("sensor", name, "motion", ax, ay, az);
      sendOsc(`/user/${safe}/motion`, [ax, ay, az]);
      recordSensor(name, "motion", `${ax.toFixed(1)} ${ay.toFixed(1)} ${az.toFixed(1)}`);
      break;
    }
    case "gyro": {
      const rx = numOr0(msg.rx), ry = numOr0(msg.ry), rz = numOr0(msg.rz);
      Max.outlet("sensor", name, "gyro", rx, ry, rz);
      sendOsc(`/user/${safe}/gyro`, [rx, ry, rz]);
      break;
    }
    case "orient": {
      const a = numOr0(msg.alpha), b = numOr0(msg.beta), g = numOr0(msg.gamma);
      Max.outlet("sensor", name, "orient", a, b, g);
      sendOsc(`/user/${safe}/orient`, [a, b, g]);
      recordSensor(name, "orient", `${a.toFixed(0)} ${b.toFixed(0)} ${g.toFixed(0)}`);
      break;
    }
    case "heading": {
      const h = numOr0(msg.heading);
      Max.outlet("sensor", name, "heading", h);
      sendOsc(`/user/${safe}/heading`, [h]);
      recordSensor(name, "heading", h.toFixed(1));
      break;
    }
    case "geo": {
      const lat = numOr0(msg.lat), lon = numOr0(msg.lon);
      const alt = numOr0(msg.alt), acc = numOr0(msg.accuracy);
      Max.outlet("sensor", name, "geo", lat, lon, alt, acc);
      sendOsc(`/user/${safe}/geo`, [lat, lon, alt, acc]);
      recordSensor(name, "geo", `${lat.toFixed(3)},${lon.toFixed(3)}`);
      break;
    }
    case "mic": {
      const level = numOr0(msg.level), peak = numOr0(msg.peak);
      Max.outlet("sensor", name, "mic", level, peak);
      sendOsc(`/user/${safe}/mic`, [level, peak]);
      recordSensor(name, "mic", `${level.toFixed(2)}/${peak.toFixed(2)}`);
      break;
    }
    case "touch": {
      // msg.touches: [{i, x, y, force}, ...]   x/y normalized 0..1
      const touches = Array.isArray(msg.touches) ? msg.touches : [];
      Max.outlet("sensor", name, "touch", "count", touches.length);
      sendOsc(`/user/${safe}/touch/count`, [touches.length]);
      touches.forEach(t => {
        const i = numOr0(t.i), x = numOr0(t.x), y = numOr0(t.y), f = numOr0(t.force);
        Max.outlet("sensor", name, "touch", i, x, y, f);
        sendOsc(`/user/${safe}/touch/${i}`, [x, y, f]);
      });
      recordSensor(name, "touch", `${touches.length}`);
      break;
    }
    case "battery": {
      const level = numOr0(msg.level);
      const charging = msg.charging ? 1 : 0;
      Max.outlet("sensor", name, "battery", level, charging);
      sendOsc(`/user/${safe}/battery`, [level, charging]);
      recordSensor(name, "battery", `${Math.round(level * 100)}%${charging ? "+" : ""}`);
      break;
    }
    case "net": {
      const type = String(msg.netType || "unknown");
      const down = numOr0(msg.downlink);
      Max.outlet("sensor", name, "net", type, down);
      sendOsc(`/user/${safe}/net`, [type, down]);
      break;
    }
    case "light": {
      const lux = numOr0(msg.lux);
      Max.outlet("sensor", name, "light", lux);
      sendOsc(`/user/${safe}/light`, [lux]);
      break;
    }
    case "pointer": {
      // x, y normalized 0..1 to the pad. Pressure 0..1, tilt -90..90 deg.
      const x  = numOr0(msg.x),  y = numOr0(msg.y);
      const pr = numOr0(msg.pressure), tx = numOr0(msg.tiltX), ty = numOr0(msg.tiltY);
      const type = String(msg.ptype || "touch"); // touch|pen|mouse
      Max.outlet("sensor", name, "pointer", x, y, pr, tx, ty, type);
      sendOsc(`/user/${safe}/pointer`, [x, y, pr, tx, ty, type]);
      break;
    }
    case "gamepad": {
      const axes    = Array.isArray(msg.axes) ? msg.axes : [];
      const buttons = Array.isArray(msg.buttons) ? msg.buttons : [];
      axes.forEach((v, i)    => sendOsc(`/user/${safe}/gamepad/axis/${i}`,    [numOr0(v)]));
      buttons.forEach((v, i) => sendOsc(`/user/${safe}/gamepad/button/${i}`, [numOr0(v)]));
      // Compact Max message: a list of axes then a list of buttons, prefixed
      // for routing convenience.
      Max.outlet.apply(Max, ["sensor", name, "gamepad", "axes"].concat(axes.map(numOr0)));
      Max.outlet.apply(Max, ["sensor", name, "gamepad", "buttons"].concat(buttons.map(numOr0)));
      break;
    }
    case "gravity": {
      const gx = numOr0(msg.gx), gy = numOr0(msg.gy), gz = numOr0(msg.gz);
      Max.outlet("sensor", name, "gravity", gx, gy, gz);
      sendOsc(`/user/${safe}/gravity`, [gx, gy, gz]);
      break;
    }
    case "linaccel": {
      const ax = numOr0(msg.ax), ay = numOr0(msg.ay), az = numOr0(msg.az);
      Max.outlet("sensor", name, "linaccel", ax, ay, az);
      sendOsc(`/user/${safe}/linaccel`, [ax, ay, az]);
      break;
    }
    case "magnet": {
      const mx = numOr0(msg.mx), my = numOr0(msg.my), mz = numOr0(msg.mz);
      Max.outlet("sensor", name, "magnet", mx, my, mz);
      sendOsc(`/user/${safe}/magnet`, [mx, my, mz]);
      break;
    }
    case "pressure": {
      const hpa = numOr0(msg.hpa);
      Max.outlet("sensor", name, "pressure", hpa);
      sendOsc(`/user/${safe}/pressure`, [hpa]);
      break;
    }
    case "proximity": {
      const dist = numOr0(msg.dist), max = numOr0(msg.max);
      Max.outlet("sensor", name, "proximity", dist, max);
      sendOsc(`/user/${safe}/proximity`, [dist, max]);
      break;
    }
    case "screen": {
      const orientation = String(msg.orientation || "?");
      const visible    = msg.visible ? 1 : 0;
      const fullscreen = msg.fullscreen ? 1 : 0;
      Max.outlet("sensor", name, "screen", orientation, visible, fullscreen);
      sendOsc(`/user/${safe}/screen`, [orientation, visible, fullscreen]);
      break;
    }
    case "speech": {
      const text  = String(msg.text || "");
      const final = msg.final ? 1 : 0;
      Max.outlet("sensor", name, "speech", text, final);
      sendOsc(`/user/${safe}/speech`, [text, final]);
      recordSensor(name, "speech", text.slice(0, 32));
      break;
    }
    case "button": {
      // id is a small int identifying which pad/button. value 0 (release)
      // or 1 (press). Stored as float in OSC for consistency.
      const id    = numOr0(msg.id);
      const value = msg.value ? 1 : 0;
      Max.outlet("sensor", name, "button", id, value);
      sendOsc(`/user/${safe}/button/${id}`, [value]);
      recordSensor(name, "button", `${id}:${value}`);
      break;
    }
    case "slider": {
      const id    = numOr0(msg.id);
      const value = numOr0(msg.value);
      Max.outlet("sensor", name, "slider", id, value);
      sendOsc(`/user/${safe}/slider/${id}`, [value]);
      recordSensor(name, "slider", `${id}:${value.toFixed(2)}`);
      break;
    }
    case "dial": {
      const id    = numOr0(msg.id);
      const value = numOr0(msg.value);
      Max.outlet("sensor", name, "dial", id, value);
      sendOsc(`/user/${safe}/dial/${id}`, [value]);
      recordSensor(name, "dial", `${id}:${value.toFixed(2)}`);
      break;
    }
    case "key": {
      // Single keystroke. char is the printable character (or empty for
      // non-printables like Enter/Backspace); code is the key code symbol.
      const ch   = String(msg.char || "");
      const code = String(msg.code || "");
      Max.outlet("sensor", name, "key", ch, code);
      sendOsc(`/user/${safe}/key`, [ch, code]);
      break;
    }
    case "text": {
      // Full contents of the text input field, sent on each change.
      const text = String(msg.text || "");
      Max.outlet("sensor", name, "text", text);
      sendOsc(`/user/${safe}/text`, [text]);
      break;
    }
    case "midi": {
      // event is one of: noteon, noteoff, cc, pitchbend, aftertouch.
      // Generic shape: status data1 data2 channel. We route by sub-event.
      const event   = String(msg.event || "noteon");
      const note    = numOr0(msg.note);
      const vel     = numOr0(msg.vel);
      const cc      = numOr0(msg.cc);
      const value   = numOr0(msg.value);
      const channel = numOr0(msg.channel);
      if (event === "noteon" || event === "noteoff") {
        Max.outlet("sensor", name, "midi", event, note, vel, channel);
        sendOsc(`/user/${safe}/midi/${event}`, [note, vel, channel]);
        recordSensor(name, "midi", `${event === "noteon" ? "on" : "off"} ${note}`);
      } else if (event === "cc") {
        Max.outlet("sensor", name, "midi", "cc", cc, value, channel);
        sendOsc(`/user/${safe}/midi/cc`, [cc, value, channel]);
      } else if (event === "pitchbend") {
        Max.outlet("sensor", name, "midi", "pitchbend", value, channel);
        sendOsc(`/user/${safe}/midi/pitchbend`, [value, channel]);
      } else if (event === "aftertouch") {
        Max.outlet("sensor", name, "midi", "aftertouch", note, value, channel);
        sendOsc(`/user/${safe}/midi/aftertouch`, [note, value, channel]);
      }
      break;
    }
    // Unknown kinds just drop — the template gives Max a stable surface to
    // route, so adding a new sensor means adding a case here AND a route
    // entry in the patch.
  }
}

function numOr0(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

// ── state mutations ────────────────────────────────────────────

function addPerformer(name, ws) {
  if (!performers.has(name)) {
    performers.set(name, freshPerformer(name));
    Max.outlet("performer", "add", name);
  }
  const p     = performers.get(name);
  const oldWs = sockets.get(name);
  p.connected = true;
  // Overwrite the sockets entry BEFORE closing the orphan, so the orphan's
  // close handler doesn't find itself in `sockets` and disconnect the new
  // socket. (Same pattern as IMMER.)
  sockets.set(name, ws);
  if (oldWs && oldWs !== ws) {
    try { oldWs.close(); } catch (_) {}
  }
  sendRoster();
  emitPerformerRoles(p);
}

function disconnectPerformer(name) {
  const p = performers.get(name);
  if (!p) return;
  p.connected = false;
  sockets.delete(name);
  // We deliberately KEEP the performer record — name+roles+admin auth
  // survive a flaky socket so a phone lock or wifi blip doesn't kick them
  // out of the piece. Use `clear` from the patch to wipe everyone.
  Max.outlet("performer", "role", name, "offline");
  sendRoster();
}

function removePerformer(name) {
  if (!performers.has(name)) return;
  performers.delete(name);
  sockets.delete(name);
  Max.outlet("performer", "remove", name);
  sendRoster();
  emitAdminCount();
}

function applyRoles(name, wantedRoles, password) {
  const p = performers.get(name);
  if (!p) return;
  const validRoles = new Set(cfg.roles);
  const next = new Set();
  let adminRequested = false;
  wantedRoles.forEach(r => {
    if (r === ADMIN_ROLE) adminRequested = true;
    else if (validRoles.has(r)) next.add(r);
  });
  if (adminRequested) {
    // Two regimes:
    //   • cfg.password empty  → admin is a free role; anyone can claim it.
    //   • cfg.password set    → admin requires the password challenge.
    if (cfg.password.length === 0) {
      next.add(ADMIN_ROLE);
      p.isAdmin = true;
    } else if (password === cfg.password) {
      next.add(ADMIN_ROLE);
      p.isAdmin = true;
    } else {
      // Wrong password — strip admin. Keep their non-admin roles; we just
      // refuse the elevation.
      p.isAdmin = false;
      sendTo(sockets.get(name), { type: "error", message: "wrong admin password" });
    }
  } else {
    p.isAdmin = false;
  }
  p.roles = next;
  emitPerformerRoles(p);
  emitAdminCount();
}

function emitPerformerRoles(p) {
  // Single space-separated list — easy to route with [unpack s s s s ...]
  // in Max, or to grab as a list via [zl].
  const list = Array.from(p.roles);
  Max.outlet.apply(Max, ["performer", "roles", p.name].concat(list.length ? list : ["idle"]));
}

function emitAdminCount() {
  let n = 0;
  performers.forEach(p => { if (p.isAdmin && p.connected) n++; });
  Max.outlet("admincount", n);
}

function sendRoster() {
  const names = Array.from(performers.keys());
  Max.outlet.apply(Max, ["roster"].concat(names.length ? names : ["(empty)"]));
}

// ── snapshot (sent to clients) ─────────────────────────────────

function snapshotFor(viewerName) {
  const roster = [];
  performers.forEach(p => {
    roster.push({
      name:      p.name,
      roles:     Array.from(p.roles),
      isAdmin:   p.isAdmin,
      connected: p.connected
    });
  });
  let adminCount = 0;
  performers.forEach(p => { if (p.isAdmin && p.connected) adminCount++; });
  // "admin" is always presented as a role tile alongside the configured
  // ones. Dedup defensively in case cfg.roles happens to contain "admin"
  // (e.g. operator typed it into the Roles textedit before setroles'
  // filter ran, a derived repo edited the default, etc.) — without the
  // dedup the role grid renders two "admin" tiles.
  const available = cfg.roles.filter(r => r !== ADMIN_ROLE).concat([ADMIN_ROLE]);
  const out = {
    type:           "snapshot",
    started,
    availableRoles:        available,
    // adminRequiresPassword tells the client whether picking admin
    // triggers a password challenge or is a free claim.
    adminRequiresPassword: cfg.password.length > 0,
    // Legacy field kept for any older clients that still read it; same
    // semantics: true when picking admin requires a password.
    adminEnabled:          cfg.password.length > 0,
    adminCount,
    roster
  };
  if (viewerName && performers.has(viewerName)) {
    const p = performers.get(viewerName);
    out.you = { name: p.name, roles: Array.from(p.roles), isAdmin: p.isAdmin };
  }
  return out;
}

function sendTo(ws, obj) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function broadcastSnapshot() {
  if (wss) {
    // Iterate wss.clients so unjoined lobby viewers also get roster
    // updates; otherwise a phone that opened the page but hasn't typed a
    // name yet sees a stale "Already joined" list forever.
    const wsToName = new Map();
    sockets.forEach((s, name) => wsToName.set(s, name));
    wss.clients.forEach((ws) => {
      if (ws.readyState !== 1) return;
      sendTo(ws, snapshotFor(wsToName.get(ws) || null));
    });
  }
  // Cloud-side: send three layers in order so every connected client
  // ends up with the correct view.
  //
  // 1. Generic snapshot to ALL perform connections — covers fresh
  //    joiners that haven't sent their {type:"join"} yet (no name on
  //    the host side, so no per-name directed message would reach
  //    them).
  // 2. Generic snapshot to ALL audience connections — they don't have
  //    a `you` field anyway.
  // 3. Personalized snapshot directed to each named remote performer
  //    — overwrites the generic above with a `you` field.
  //
  // Order matters: generic FIRST so the directed snapshot's `you`
  // field wins on named performers. Reversing this order causes the
  // generic to clobber `you` after the directed arrived.
  if (cloudWs && cloudReady) {
    try { cloudWs.send(JSON.stringify(Object.assign({ toRole: "perform"  }, snapshotFor(null)))); } catch (_) {}
    try { cloudWs.send(JSON.stringify(Object.assign({ toRole: "audience" }, snapshotFor(null)))); } catch (_) {}
    performers.forEach(p => {
      if (p.kind !== "remote") return;
      try { cloudWs.send(JSON.stringify(Object.assign({ to: p.name }, snapshotFor(p.name)))); } catch (_) {}
    });
  }
  // Repaint the monitor cellblock so name/roles/connection columns track
  // joins, leaves, and role changes. Sensor columns are repainted by
  // recordSensor independently — the schedMonitor coalesces both.
  schedMonitor();
}

// ── transport ──────────────────────────────────────────────────

function beginPiece() {
  if (started) return;
  started = true;
  Max.outlet("started", 1);
  Max.outlet("status", `Started — ${performers.size} performers`);
  broadcastSnapshot();
}

function stopPiece() {
  if (!started) return;
  started = false;
  Max.outlet("started", 0);
  Max.outlet("status", "Stopped — back to lobby");
  broadcastSnapshot();
}

// ── periodic tick ──────────────────────────────────────────────

function tick() {
  // Snapshot every two seconds so roster / role state stays fresh even when
  // no client is actively pushing events. Sensor streams come on their own
  // cadence and don't need the tick.
  broadcastSnapshot();
}

// ── boot ───────────────────────────────────────────────────────

function startServer() {
  httpServer = createHttpServer();
  httpServer.on("error", (err) => {
    Max.post(`HTTP server error: ${err.message}`, "error");
    Max.outlet("status", `HTTP error: ${err.message}`);
  });
  httpServer.listen(cfg.port, () => {
    const url = publicUrl();
    Max.post(`server listening at ${url}`);
    Max.outlet("url", url);
    Max.outlet("status", `Listening on ${url}`);
  });
  if (WSServer) {
    wss = new WSServer({ server: httpServer });
    wss.on("connection", attachWsHandlers);
  }
  if (tickTimer)      clearInterval(tickTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  tickTimer      = setInterval(tick,      2000);
  heartbeatTimer = setInterval(heartbeat, HEARTBEAT_MS);
  startOsc();
  // Paint the monitor header row immediately so the operator sees the
  // grid before anyone has joined.
  pushMonitor();
  // Same idea for the share URLs — emit the current placeholder text
  // (or the live URL if cfg is already populated) so the comments fill
  // in on first patcher open.
  emitShareUrls();
}

function stopServer() {
  if (tickTimer)      { clearInterval(tickTimer);      tickTimer = null; }
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  if (wss) {
    wss.clients.forEach((ws) => { try { ws.terminate(); } catch (_) {} });
    try { wss.close(); } catch (_) {}
    wss = null;
  }
  if (httpServer) {
    try { httpServer.close(); } catch (_) {}
    httpServer = null;
  }
  stopOsc();
}

// ── max handlers ───────────────────────────────────────────────

Max.addHandler("setport", (p) => {
  const port = Math.max(1, Math.min(65535, Number(p) || 0));
  if (port === cfg.port) return;
  if (started) {
    // Restarting the HTTP server would drop every connected client (their
    // location.host is fixed at page load) — refuse rather than silently
    // accepting the change.
    Max.outlet("status", "Port change refused — stop the piece first");
    return;
  }
  cfg.port = port;
  Max.post(`port → ${port} — restarting`);
  stopServer();
  startServer();
  // Re-announce LAN URL to the relay so /lan/<piece>/<room> stays
  // accurate after a port change.
  if (cloudWs && cloudReady) {
    try { cloudWs.send(JSON.stringify({ type: "host-info", lanUrl: publicUrl() })); } catch (_) {}
  }
});

Max.addHandler("setoscport", (p) => {
  const port = Math.max(1, Math.min(65535, Number(p) || 0));
  cfg.oscPort = port;
  Max.post(`OSC port → ${port}`);
  stopOsc();
  startOsc();
});

Max.addHandler("setoschost", (h) => {
  cfg.oscHost = String(h);
  Max.post(`OSC host → ${cfg.oscHost}`);
  stopOsc();
  startOsc();
});

// Max textedits emit their content prefixed with the literal symbol
// `text` when banged (e.g. by the patch's loadbang chain). Strip it so
// handlers see the actual content.
function teArgs(args) {
  return (args.length > 0 && String(args[0]) === "text") ? args.slice(1) : args;
}

Max.addHandler("setpassword", (...args) => {
  args = teArgs(args);
  // Accept either a single symbol or a list (Max sometimes splits on spaces).
  cfg.password = args.map(String).join(" ").trim();
  Max.post(`admin password ${cfg.password ? "set" : "cleared (admin disabled)"}`);
  // Any existing admins keep their auth — we don't strip them on rotation
  // (rotation is intended to lock out future joiners, not boot current ones).
  broadcastSnapshot();
});

Max.addHandler("setroles", (...args) => {
  args = teArgs(args);
  // setroles role1 role2 role3 ...   replaces the non-admin role list.
  const list = args.map(String).map(s => s.trim()).filter(s => s && s !== ADMIN_ROLE);
  if (list.length === 0) {
    Max.post("setroles ignored — at least one role required", "error");
    return;
  }
  cfg.roles = list;
  Max.post(`roles → ${list.join(", ")}`);
  // Any role no longer in the list is stripped from every performer.
  const valid = new Set(list);
  performers.forEach(p => {
    const next = new Set();
    p.roles.forEach(r => { if (valid.has(r) || r === ADMIN_ROLE) next.add(r); });
    p.roles = next;
    emitPerformerRoles(p);
  });
  broadcastSnapshot();
});

// ── Max → phones (commands sent over the WS to one or all clients) ──

// Send a {type:"cmd", ...} message to one performer by name, or to everyone
// (with sensor stage active) if name is null/empty. Performers reachable
// over the LAN go through their direct ws; remote performers go through
// the cloud relay (directed by `to: <name>`). Disconnected performers
// silently drop the command — there's no inbound socket to fire on rejoin.
function sendCmdToName(name, cmd) {
  const payload = Object.assign({ type: "cmd" }, cmd);
  if (!name) {
    // Broadcast: LAN + cloud (relay fans cloud to all perform+audience).
    sockets.forEach((ws) => sendTo(ws, payload));
    if (cloudWs && cloudReady) {
      try { cloudWs.send(JSON.stringify(Object.assign({ toRole: "perform" }, payload))); } catch (_) {}
    }
    return;
  }
  const p = performers.get(name);
  if (p && p.kind === "remote") {
    if (cloudWs && cloudReady) {
      try { cloudWs.send(JSON.stringify(Object.assign({ to: name }, payload))); } catch (_) {}
    }
    return;
  }
  const ws = sockets.get(name);
  if (ws) sendTo(ws, payload);
}

Max.addHandler("vibrate", (ms) => {
  sendCmdToName(null, { cmd: "vibrate", ms: Number(ms) || 0 });
});
Max.addHandler("vibrateto", (name, ms) => {
  sendCmdToName(String(name), { cmd: "vibrate", ms: Number(ms) || 0 });
});

Max.addHandler("speak", (...args) => {
  sendCmdToName(null, { cmd: "speak", text: args.map(String).join(" ") });
});
Max.addHandler("speakto", (name, ...args) => {
  sendCmdToName(String(name), { cmd: "speak", text: args.map(String).join(" ") });
});

Max.addHandler("beep", (freq, ms) => {
  sendCmdToName(null, { cmd: "beep", freq: Number(freq) || 440, ms: Number(ms) || 100 });
});
Max.addHandler("beepto", (name, freq, ms) => {
  sendCmdToName(String(name), { cmd: "beep", freq: Number(freq) || 440, ms: Number(ms) || 100 });
});

Max.addHandler("display", (...args) => {
  sendCmdToName(null, { cmd: "display", text: args.map(String).join(" ") });
});
Max.addHandler("displayto", (name, ...args) => {
  sendCmdToName(String(name), { cmd: "display", text: args.map(String).join(" ") });
});

Max.addHandler("synthnote", (note, vel) => {
  sendCmdToName(null, { cmd: "synthnote", note: Number(note) || 0, vel: Number(vel) || 0 });
});
Max.addHandler("synthnoteto", (name, note, vel) => {
  sendCmdToName(String(name), { cmd: "synthnote", note: Number(note) || 0, vel: Number(vel) || 0 });
});

Max.addHandler("synthset", (param, value) => {
  sendCmdToName(null, { cmd: "synthset", param: String(param), value: Number(value) || 0 });
});
Max.addHandler("synthsetto", (name, param, value) => {
  sendCmdToName(String(name), { cmd: "synthset", param: String(param), value: Number(value) || 0 });
});

Max.addHandler("synthmode", (mode) => {
  sendCmdToName(null, { cmd: "synthmode", mode: String(mode) });
});
Max.addHandler("synthmodeto", (name, mode) => {
  sendCmdToName(String(name), { cmd: "synthmode", mode: String(mode) });
});

Max.addHandler("start", () => beginPiece());
Max.addHandler("stop",  () => stopPiece());
Max.addHandler("clear", () => {
  performers.clear();
  sockets.forEach((ws) => { try { ws.close(); } catch (_) {} });
  sockets.clear();
  started = false;
  Max.outlet("started", 0);
  sendRoster();
  emitAdminCount();
  Max.outlet("status", "Cleared — everyone kicked");
  // Don't auto-broadcast — there's nobody to broadcast to.
});

Max.addHandler("ip",     () => Max.outlet("url", publicUrl()));
Max.addHandler("status", () => Max.outlet("status",
  `${performers.size} performers, ${started ? "running" : "lobby"}`));

// ── cloud bridge (Max ↔ shared CF Worker relay) ─────────────────
//
// Optional: lets this LAN server also expose the same room to remote
// performers and audience over the internet via the generic
// `cloud/worker` relay. We open ONE outbound WebSocket as the "host" of
// a (piece, room) pair; the relay routes:
//
//   host  → broadcasts to all remote performers + audience
//   host  → directed messages (vibrate, snapshot, etc.) by `to: <name>`
//   relay → us:  remote performer messages (with fromRole:"perform")
//   relay → us:  audience inputs (with fromRole:"audience")
//
// LAN performers see a unified roster — remote performers are added to
// the same `performers` map with `kind: "remote"`. Sensor data is
// processed identically and reaches Max (and OSC) the same way.

let WSClient = null;
try { WSClient = require("ws").WebSocket; } catch (_) {}

let cloudWs       = null;
let cloudReady    = false;
let cloudReconnTimer = null;
let cloudClosing  = false;  // distinguish user-requested disconnect from drops

const cloudCfg = {
  // Shared mu-relay Cloudflare Worker URL. Baked in here rather than
  // exposed as a textedit in the patch — textedit was a poor fit for
  // set-once config (see Claude2Max CLAUDE.md > "Don't use [textedit]
  // for set-once configuration"). Derived repos override this constant
  // directly in their fork's server.js if they deploy their own relay.
  url:   "wss://mu-relay.jannone-544.workers.dev",
  piece: "multi-user-template",
  room:  "main",
  // Static site base where the client (public/index.html) is hosted.
  // Used to build the shareable performer / audience URLs. Default points
  // at GitHub Pages for the template repo; derived repos should override
  // via `setsitebase`.
  siteBase: "https://john.jann.one/multi-user-template/"
};

function emitCloudStatus(text) {
  Max.outlet("cloud", "status", text);
}
function emitCloudConnected(b) {
  Max.outlet("cloud", "connected", b ? 1 : 0);
}

function buildCloudWsUrl() {
  if (!cloudCfg.url) return null;
  const trimmed = cloudCfg.url.replace(/\/+$/, "");
  const piece   = encodeURIComponent(cloudCfg.piece);
  const room    = encodeURIComponent(cloudCfg.room);
  return `${trimmed}/mu/${piece}/${room}/host`;
}

// Shareable URLs that performers and audience open in their phone
// browsers. Both reuse the same static index.html and select their role
// via query params. We URL-encode the ws:// URL because it gets passed
// verbatim through query-string handling.
function emitShareUrls() {
  if (!cloudCfg.url || !cloudCfg.piece || !cloudCfg.room || !cloudCfg.siteBase) {
    Max.outlet("cloud", "performurl",  "(set Cloud URL, Piece, Room, Site base)");
    Max.outlet("cloud", "audienceurl", "(set Cloud URL, Piece, Room, Site base)");
    return;
  }
  const base    = cloudCfg.siteBase.replace(/\/+$/, "/");
  const encoded = encodeURIComponent(cloudCfg.url);
  const piece   = encodeURIComponent(cloudCfg.piece);
  const room    = encodeURIComponent(cloudCfg.room);
  const perform  = `${base}?cloud=${encoded}&piece=${piece}&room=${room}`;
  const audience = `${base}?cloud=${encoded}&piece=${piece}&room=${room}&view=audience`;
  Max.outlet("cloud", "performurl",  perform);
  Max.outlet("cloud", "audienceurl", audience);
}

function cloudConnect() {
  if (!WSClient) { emitCloudStatus("cloud disabled — ws module not loaded"); return; }
  if (!cloudCfg.url) { emitCloudStatus("set cloud URL first"); return; }
  // Catch un-edited placeholder text early — otherwise the ws library
  // tries to dial a literal "<your-subdomain>" host and throws an
  // opaque "Invalid URL" error mid-connect.
  if (/<[^>]+>/.test(cloudCfg.url)) {
    emitCloudStatus(`Cloud URL contains a placeholder (${cloudCfg.url}). Replace with your actual deployed worker URL.`);
    return;
  }
  if (!/^wss?:\/\//.test(cloudCfg.url)) {
    emitCloudStatus(`Cloud URL must start with wss:// or ws:// — got "${cloudCfg.url}"`);
    return;
  }
  cloudDisconnect(true /* silent */);
  cloudClosing = false;
  const u = buildCloudWsUrl();
  emitCloudStatus(`connecting → ${u}`);
  let sock;
  try { sock = new WSClient(u); }
  catch (e) { emitCloudStatus(`connect failed: ${e.message}`); return; }
  cloudWs = sock;
  sock.on("open", () => {
    cloudReady = true;
    emitCloudConnected(true);
    emitCloudStatus(`cloud host live — ${cloudCfg.piece}:${cloudCfg.room}`);
    // Announce our LAN URL to the relay so the /lan/<piece>/<room>
    // redirect endpoint (used by static "Local mode" buttons on
    // landing pages) can resolve to a real http://<lan-ip>:8080/.
    try { sock.send(JSON.stringify({ type: "host-info", lanUrl: publicUrl() })); } catch (_) {}
    // Push the current snapshot immediately so any waiting remote
    // performers / audience hear about us.
    broadcastSnapshot();
  });
  sock.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(String(raw)); } catch (_) { return; }
    handleCloudInbound(msg);
  });
  sock.on("close", () => {
    cloudReady = false;
    if (cloudWs === sock) cloudWs = null;
    emitCloudConnected(false);
    if (cloudClosing) {
      emitCloudStatus("cloud disconnected (user requested)");
      return;
    }
    emitCloudStatus("cloud connection lost — retrying in 3s");
    cloudReconnTimer = setTimeout(cloudConnect, 3000);
  });
  sock.on("error", (err) => {
    emitCloudStatus(`cloud error: ${err.message || err}`);
    // close fires after — let it handle reconnect
  });
}

function cloudDisconnect(silent) {
  cloudClosing = true;
  if (cloudReconnTimer) { clearTimeout(cloudReconnTimer); cloudReconnTimer = null; }
  if (cloudWs) {
    try { cloudWs.close(); } catch (_) {}
    cloudWs = null;
  }
  cloudReady = false;
  if (!silent) {
    emitCloudConnected(false);
    emitCloudStatus("cloud disconnected");
  }
}

// Relay → host. Everything inbound from the cloud is annotated with
// `fromRole` (perform | audience) and `from` (the performer name).
function handleCloudInbound(msg) {
  if (!msg || !msg.type) return;
  if (msg.type === "mu-hello") {
    emitCloudStatus(`relay handshake — counts ${JSON.stringify(msg.connections)}`);
    return;
  }
  if (msg.type === "mu-presence") {
    // The relay tells us when a remote conn joins / leaves the room.
    // Joins arrive without a name; we wait for the actual {type:"join"}
    // to come through (which carries the name).
    if (msg.event === "join") {
      // A fresh perform or audience connection just opened on the
      // relay. Push the current state immediately so they don't have
      // to wait for the next 2s tick — otherwise the join screen
      // sits on "waiting for snapshot" for up to two seconds.
      broadcastSnapshot();
      if (msg.role === "audience") Max.outlet("audience", "join", "?");
    }
    if (msg.event === "leave" && msg.role === "perform" && msg.name) {
      const p = performers.get(msg.name);
      if (p && p.kind === "remote") {
        p.connected = false;
        Max.outlet("performer", "role", p.name, "offline");
        sendRoster();
      }
    }
    if (msg.event === "leave" && msg.role === "audience") {
      Max.outlet("audience", "leave", msg.name || "?");
    }
    return;
  }

  if (msg.fromRole === "audience") {
    handleAudienceInbound(msg);
    return;
  }

  if (msg.fromRole === "perform") {
    handleRemotePerformInbound(msg);
    return;
  }
  // anything else from the relay (e.g. echoes) — drop
}

function handleAudienceInbound(msg) {
  const who = String(msg.from || "?");
  if (msg.type === "audience-input") {
    const kind  = String(msg.kind || "");
    const id    = Number(msg.id) || 0;
    const value = Number(msg.value) || 0;
    Max.outlet("audience", "input", who, kind, id, value);
    sendOsc(`/audience/${oscSafe(who)}/${kind}/${id}`, [value]);
  } else if (msg.type === "audience-react") {
    Max.outlet("audience", "react", who, String(msg.emoji || ""));
  } else if (msg.type === "ping") {
    Max.outlet("audience", "ping", who);
  }
}

function handleRemotePerformInbound(msg) {
  const name = String(msg.from || msg.name || "").trim();
  if (!name) return;

  if (msg.type === "join") {
    // First we hear about this performer. Create a remote record.
    if (!performers.has(name)) {
      const p = freshPerformer(name);
      p.kind = "remote";
      performers.set(name, p);
      Max.outlet("performer", "add", name);
    }
    const p = performers.get(name);
    p.kind = "remote";
    p.connected = true;
    sendRoster();
    emitPerformerRoles(p);
    // Match the LAN path: send a {type:"joined"} ack THEN the
    // personalized snapshot. The client uses the "joined" event to
    // trigger sendRoles() — without it cloud performers never
    // transmit the role tiles they picked on the Join screen, so
    // p.roles stays empty and downstream UI (admin chip, START
    // button, roster role labels) all render as if no role was
    // chosen. See client app.js handleServerMessage.
    if (cloudWs && cloudReady) {
      try { cloudWs.send(JSON.stringify({ to: name, type: "joined", name })); } catch (_) {}
      try { cloudWs.send(JSON.stringify(Object.assign({ to: name }, snapshotFor(name)))); } catch (_) {}
    }
    return;
  }

  // For all subsequent messages, require the performer record to exist.
  if (!performers.has(name)) {
    // Implicit join — a sensor message arrived before {type:"join"}.
    // Treat it as a fresh remote performer to avoid losing data.
    const p = freshPerformer(name);
    p.kind = "remote";
    performers.set(name, p);
    Max.outlet("performer", "add", name);
    sendRoster();
  }
  performers.get(name).kind      = "remote";
  performers.get(name).connected = true;

  if (msg.type === "roles") {
    const wanted = Array.isArray(msg.roles) ? msg.roles.map(String) : [];
    const password = String(msg.password || "");
    applyRoles(name, wanted, password);
  } else if (msg.type === "leave") {
    removePerformer(name);
  } else if (msg.type === "sensor") {
    handleSensor(name, msg);
  } else if (msg.type === "start") {
    const p = performers.get(name);
    if (p && p.isAdmin) beginPiece();
  } else if (msg.type === "stop") {
    const p = performers.get(name);
    if (p && p.isAdmin) stopPiece();
  }
}

// ── Max handlers for the cloud bridge ───────────────────────────

Max.addHandler("setcloudurl", (...args) => {
  args = teArgs(args);
  cloudCfg.url = args.map(String).join(" ").trim();
  Max.post(`cloud URL → ${cloudCfg.url || "(empty)"}`);
  emitShareUrls();
});
Max.addHandler("setpiece", (...args) => {
  args = teArgs(args);
  const s = args.map(String).join("-").trim();
  if (!/^[A-Za-z0-9_\-]+$/.test(s)) {
    emitCloudStatus("piece must match [A-Za-z0-9_-]");
    return;
  }
  cloudCfg.piece = s;
  Max.post(`piece → ${s}`);
  emitShareUrls();
});
Max.addHandler("setroom", (...args) => {
  args = teArgs(args);
  const s = args.map(String).join("-").trim() || "main";
  if (!/^[A-Za-z0-9_\-]+$/.test(s)) {
    emitCloudStatus("room must match [A-Za-z0-9_-]");
    return;
  }
  cloudCfg.room = s;
  Max.post(`room → ${s}`);
  emitShareUrls();
});
Max.addHandler("setsitebase", (...args) => {
  args = teArgs(args);
  // Where the static index.html is hosted — typically a GitHub Pages URL
  // like https://<user>.github.io/<repo>/. Trailing slash is normalized.
  cloudCfg.siteBase = args.map(String).join(" ").trim();
  Max.post(`site base → ${cloudCfg.siteBase || "(empty)"}`);
  emitShareUrls();
});
Max.addHandler("cloudon",  () => cloudConnect());
Max.addHandler("cloudoff", () => cloudDisconnect(false));
Max.addHandler("cloudstatus", () => {
  emitCloudStatus(`url=${cloudCfg.url || "?"} piece=${cloudCfg.piece} room=${cloudCfg.room} connected=${cloudReady ? 1 : 0}`);
});

// Auto-boot the moment node.script loads us.
startServer();
