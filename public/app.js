// multi-user-template — client app
//
// Single-page client with three modes:
//   1. Join     — name + role selection (admin password reveals when admin role is toggled)
//   2. Lobby    — confirmed roles + roster; admin sees a START button
//   3. Stage    — tabbed test pages, each exposing a sensor / control / output
//
// Tab state lives in location.hash so a refresh returns to the same tab.
// (No localStorage — same rule as IMMER: a hard refresh is the canonical
// "reset me" gesture; only in-session WS drops auto-rejoin.)

"use strict";

// ── client config (from URL params) ─────────────────────────────
//
// Default (no params): connect to ws://<location.host>/ — the LAN
// Max-hosted server.
//
// Cloud mode: include ?cloud=<encoded-wss-url>&piece=<slug>&room=<slug>
//   ?view=audience  → audience UI (broadcast view + reactions + simple controls)
//   default         → performer UI (the full Stage with every sensor tab)
//
// Examples:
//   http://192.168.1.5:8080/                     → LAN performer (Max)
//   https://john.jann.one/multi-user-template/?cloud=wss%3A%2F%2Fmu-relay.foo.workers.dev&piece=immer-2026&room=main
//       → remote performer over CF Worker
//   .../?cloud=...&piece=...&room=...&view=audience
//       → audience view over CF Worker

const qp = new URLSearchParams(location.search);
const config = {
  cloudUrl: (qp.get("cloud") || "").trim(),       // wss://...workers.dev (no path)
  piece:    (qp.get("piece") || "").trim(),
  room:     (qp.get("room")  || "").trim(),
  view:     (qp.get("view")  || "perform").trim()
};
const isCloud    = config.cloudUrl && config.piece && config.room;
const isAudience = isCloud && config.view === "audience";

// When the page is served from the public Pages site (john.jann.one or
// *.github.io) WITHOUT cloud query params, there's no usable WebSocket
// target — the Pages host doesn't run server.js. Skip the connect loop
// and show a landing instead, so a visitor who clicks the project link
// from john.jann.one sees something useful instead of an infinite spinner.
const isPublicHost = /(github\.io|jann\.one)$/i.test(location.hostname);
const isLanding    = isPublicHost && !isCloud;

// ── state ───────────────────────────────────────────────────────

let myName       = null;
let pendingName  = "";
let pendingRoles = new Set();
let lastSnap     = null;

let ws           = null;
let wsReady      = false;
let reconnectTimer = null;
// Last `mu-hello` from the relay (cloud mode only). Carries a count of
// connected hosts/performers/audience so the join screen can show a
// helpful "waiting for Max host" state when the relay is reachable but
// no host has registered yet.
let cloudHello   = null;

// Per-tab "is the stream on" flags, kept in one place so tab re-renders
// can show the correct ON/OFF state.
const sensors = {
  motion:    { on: false, lastSent: 0, intervalMs: 60 },
  gyro:      { on: false, lastSent: 0, intervalMs: 60 },
  orient:    { on: false, lastSent: 0, intervalMs: 60 },
  heading:   { on: false, lastSent: 0, intervalMs: 100 },
  gravity:   { on: false, lastSent: 0, intervalMs: 100, sensor: null },
  linaccel:  { on: false, lastSent: 0, intervalMs: 100, sensor: null },
  magnet:    { on: false, lastSent: 0, intervalMs: 100, sensor: null },
  pressure:  { on: false, sensor: null },
  proximity: { on: false },
  geo:       { on: false, watchId: null },
  mic:       { on: false, ctx: null, stream: null, raf: 0, analyser: null },
  camera:    { on: false, stream: null },
  speech:    { on: false, rec: null },
  pointer:   { on: false },
  gamepad:   { on: false, raf: 0 },
  battery:   { on: false, ref: null, push: null },
  net:       { on: false, push: null, ref: null },
  light:     { on: false, sensor: null },
  screen:    { on: false, push: null, mql: null },
  bluetooth: { on: false },
  nfc:       { on: false, reader: null },
};

// Output-side state (driven by Max → phone commands).
const audio = {
  ctx: null,                    // shared AudioContext, lazily created on first user gesture
  master: null,                 // master gain
  voice: null,                  // current voice (nullable)
  mode: "osc",                  // osc | fm | wavetable | sample
  params: {
    attack:   0.005,
    release:  0.20,
    cutoff:   8000,
    q:        0.7,
    modIndex: 200,              // FM only — modulator depth (Hz)
    modRatio: 2.0,              // FM only — modulator/carrier ratio
    waveform: "sawtooth",       // osc only
    sampleUrl: ""               // sample mode — URL to load
  },
  sampleBuffer: null
};

// Active multi-touch points for the Touch tab (so the OSC stream and the
// dots on screen stay in sync between re-renders).
const touchState = { active: new Map() };

// ── ws plumbing ─────────────────────────────────────────────────

function wsUrl() {
  if (isCloud) {
    const trimmed = config.cloudUrl.replace(/\/+$/, "");
    const role    = isAudience ? "audience" : "perform";
    return `${trimmed}/mu/${encodeURIComponent(config.piece)}/${encodeURIComponent(config.room)}/${role}`;
  }
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return proto + "//" + location.host + "/";
}
function connect() {
  if (isLanding) {
    // Hosted on the public Pages site with no cloud params — there's
    // nothing to connect to. Don't enter the reconnect loop; the
    // landing screen explains how to actually use the template.
    setMeta("landing");
    return;
  }
  try { ws = new WebSocket(wsUrl()); }
  catch (e) { setMeta("ws fail", true); scheduleReconnect(); return; }
  ws.onopen = () => {
    wsReady = true;
    setMeta(myName ? "online" : "lobby");
    if (myName) sendJoin(myName);
  };
  ws.onmessage = (ev) => {
    let msg; try { msg = JSON.parse(ev.data); } catch (_) { return; }
    handleServerMessage(msg);
  };
  ws.onclose = () => { wsReady = false; setMeta("offline", true); scheduleReconnect(); };
  ws.onerror = () => { /* close fires after */ };
}
function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => { reconnectTimer = null; connect(); }, 1500);
}
function wsSend(obj) {
  if (!ws || !wsReady) return;
  try { ws.send(JSON.stringify(obj)); } catch (_) {}
}

function sendJoin(name)  { wsSend({ type: "join", name }); }
function sendRoles()     {
  const pw = document.getElementById("admin-pw");
  wsSend({ type: "roles", roles: Array.from(pendingRoles), password: pw ? pw.value : "" });
}
function sendStart()     { wsSend({ type: "start" }); }
function sendStop()      { wsSend({ type: "stop"  }); }

function sendSensor(kind, payload) {
  if (isAudience) {
    // Audience can't send sensor streams — the relay would drop them.
    // Re-shape relevant kinds (button/slider/dial) into audience-input
    // events that the relay allows through.
    if (kind === "button" || kind === "slider" || kind === "dial") {
      wsSend(Object.assign({ type: "audience-input", kind, name: myName }, payload));
    }
    return;
  }
  wsSend(Object.assign({ type: "sensor", kind }, payload));
}

function sendAudienceReact(emoji) {
  if (!isAudience) return;
  wsSend({ type: "audience-react", emoji, name: myName });
}

function handleServerMessage(msg) {
  if (msg.type === "mu-hello") {
    // Relay handshake — carries connection counts. Stash it so the join
    // screen can show "waiting for Max host" if no host is registered.
    cloudHello = msg;
    render();
    return;
  }
  if (msg.type === "snapshot") {
    const firstSnap   = !lastSnap;
    const prevStarted = lastSnap && lastSnap.started;
    lastSnap = msg;
    if (msg.you && pendingRoles.size === 0 && msg.you.roles.length > 0) {
      pendingRoles = new Set(msg.you.roles);
    }
    // Full re-render on:
    //   - first snapshot (the join page's role tiles need availableRoles,
    //     which arrives in the snapshot — without this re-render, the
    //     initial paint shows an empty role grid and never recovers)
    //   - stage transition (lobby ↔ stage swaps the whole screen)
    // Otherwise refresh roster + header in place so we don't stomp on
    // whatever tab / sensor card the user is interacting with.
    if (firstSnap || (prevStarted ? 1 : 0) !== (msg.started ? 1 : 0)) {
      render();
    } else {
      updateHeader();
      const rosterEl = document.querySelector("[data-roster]");
      if (rosterEl) renderRosterInto(rosterEl);
    }
  }
  else if (msg.type === "joined") {
    if (pendingRoles.size > 0) sendRoles();
  }
  else if (msg.type === "error") {
    const err = document.getElementById("err");
    if (err) err.textContent = msg.message;
  }
  else if (msg.type === "cmd") {
    handleServerCommand(msg);
  }
}

// ── header ──────────────────────────────────────────────────────

function setMeta(text, warn) {
  const m = document.getElementById("meta");
  m.textContent = text;
  m.classList.toggle("warn", !!warn);
}
function updateHeader() {
  const who = document.getElementById("who");
  who.textContent = myName
    ? (isAudience ? `${myName} · audience` : myName)
    : (isAudience ? "audience" : "multi-user template");
  const m = document.getElementById("meta");
  if (isAudience && lastSnap) {
    m.textContent = lastSnap.started ? `LIVE · ${lastSnap.roster.length} performers` : `lobby · ${lastSnap.roster.length} joined`;
    m.classList.toggle("started", !!lastSnap.started);
    m.classList.remove("warn");
    return;
  }
  if (lastSnap && lastSnap.started) {
    m.textContent = "STAGE"; m.classList.add("started"); m.classList.remove("warn");
  } else if (lastSnap) {
    m.textContent = `lobby · ${lastSnap.roster.length} joined`;
    m.classList.remove("started"); m.classList.remove("warn");
  }
}

// ── join screen ─────────────────────────────────────────────────

function renderJoin() {
  // adminRequiresPassword is the new authoritative flag; adminEnabled is
  // kept as a fallback for snapshots from older servers (same meaning).
  const adminRequiresPassword = lastSnap && (lastSnap.adminRequiresPassword ?? lastSnap.adminEnabled);
  const roles                 = (lastSnap && lastSnap.availableRoles) || [];
  // Diagnostic for the empty-role-grid case: distinguish "haven't
  // received any snapshot yet" (waiting on relay or Max) from "got a
  // snapshot but the roles list is empty" (operator-side config error).
  const noSnap   = !lastSnap;
  const noRoles  = lastSnap && roles.length === 0;
  let waitingMsg = "";
  if (noSnap) {
    if (isCloud && cloudHello) {
      const hosts = (cloudHello.connections && cloudHello.connections.host) || 0;
      waitingMsg = hosts > 0
        ? "Connected to the relay — waiting for the Max host's first snapshot…"
        : "Connected to the relay, but no Max host is online for this piece/room yet. Open the patch and press Cloud connect.";
    } else if (isCloud) {
      waitingMsg = "Connecting to the relay…";
    } else {
      waitingMsg = "Connecting to the Max server…";
    }
  } else if (noRoles) {
    waitingMsg = "The host hasn't configured any roles. In the Max patch, type roles into the Roles textedit and press Enter.";
  }
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <h1>Join</h1>
    ${waitingMsg ? `<div class="panel" style="background:#2a2a1a;border-color:var(--admin);color:var(--admin)"><strong>Waiting:</strong> ${escHtml(waitingMsg)}</div>` : ""}
    <p>Enter a name and pick one or more roles. Reconnects under the same name keep your role and admin status.</p>
    <div class="panel">
      <input id="name-in" type="text" placeholder="Your name" autocomplete="off" autocapitalize="words" value="${escAttr(pendingName)}" />
      <div style="height:12px"></div>
      <h2>Roles</h2>
      <div class="role-grid" id="role-grid">
        ${roles.map(r => `<div class="role-tile ${pendingRoles.has(r) ? "on" : ""}${r === "admin" ? " admin" : ""}" data-role="${escAttr(r)}">${escHtml(r)}</div>`).join("")}
      </div>
      ${(adminRequiresPassword && pendingRoles.has("admin")) ? `
        <div style="height:10px"></div>
        <input id="admin-pw" type="password" placeholder="Admin password" autocomplete="off" />
      ` : ""}
      <div style="height:12px"></div>
      <div class="row"><button id="join-btn" style="flex:1">Join lobby</button></div>
      <div class="err" id="err"></div>
    </div>
    ${lastSnap && lastSnap.roster.length ? `
      <div class="panel">
        <h2>Already in the lobby</h2>
        <div class="chips" data-roster></div>
      </div>` : ""}
  `;
  queueMicrotask(() => {
    const input = wrap.querySelector("#name-in");
    const btn   = wrap.querySelector("#join-btn");
    input.addEventListener("input", () => { pendingName = input.value; });
    input.focus();
    if (pendingName) input.setSelectionRange(pendingName.length, pendingName.length);
    wrap.querySelectorAll(".role-tile").forEach(t => {
      t.onclick = () => {
        pendingName = input.value;
        const r = t.getAttribute("data-role");
        if (pendingRoles.has(r)) pendingRoles.delete(r); else pendingRoles.add(r);
        render();
      };
    });
    const submit = () => {
      const v = input.value.trim();
      if (!v) return;
      if (pendingRoles.size === 0) {
        const err = wrap.querySelector("#err");
        if (err) err.textContent = "pick at least one role";
        return;
      }
      myName = v; pendingName = "";
      sendJoin(v);
      render();
    };
    btn.onclick = submit;
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
    renderRosterInto(wrap.querySelector("[data-roster]"));
  });
  return wrap;
}

// ── lobby screen ────────────────────────────────────────────────

function renderLobby() {
  const youAdmin = lastSnap && lastSnap.you && lastSnap.you.isAdmin;
  const youRoles = (lastSnap && lastSnap.you && lastSnap.you.roles) || Array.from(pendingRoles);
  const canStart = youAdmin;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <h1>Lobby</h1>
    <p>You're in. The piece starts when an admin presses START on any device or in Max.</p>

    <div class="panel">
      <h2>Your roles</h2>
      <div class="chips">
        ${youRoles.length
          ? youRoles.map(r => `<div class="chip ${r === "admin" ? "admin" : ""}">${escHtml(r)}</div>`).join("")
          : `<div class="roster-empty">no roles selected</div>`}
      </div>
      <div style="height:10px"></div>
      <div class="row">
        <button class="ghost" id="change-btn">Change roles</button>
        <button class="ghost" id="leave-btn">Leave</button>
      </div>
      <div class="err" id="err"></div>
    </div>

    <div class="lobby-banner ${canStart ? "admin-can-start" : ""}">
      ${canStart ? "You are admin — tap START when ready." : "Waiting for an admin to start the piece…"}
    </div>
    ${canStart ? `<div class="row"><button class="hot" id="start-btn" style="flex:1">START PIECE</button></div>` : ""}

    <div class="panel">
      <h2>Lobby roster (${lastSnap ? lastSnap.roster.length : 0})</h2>
      <div class="chips" data-roster></div>
    </div>
  `;
  queueMicrotask(() => {
    const changeBtn = wrap.querySelector("#change-btn");
    if (changeBtn) changeBtn.onclick = () => { pendingName = myName || ""; myName = null; render(); };
    const leaveBtn  = wrap.querySelector("#leave-btn");
    if (leaveBtn)  leaveBtn.onclick  = () => { wsSend({ type: "leave" }); myName = null; pendingRoles = new Set(); pendingName = ""; render(); };
    const startBtn  = wrap.querySelector("#start-btn");
    if (startBtn)  startBtn.onclick  = sendStart;
    renderRosterInto(wrap.querySelector("[data-roster]"));
  });
  return wrap;
}

function renderRosterInto(el) {
  if (!el || !lastSnap) return;
  el.innerHTML = "";
  lastSnap.roster.forEach(r => {
    const c = document.createElement("div");
    c.className = "chip" + (r.name === myName ? " me" : "") + (r.isAdmin ? " admin" : "") + (r.connected ? "" : " offline");
    // Each role becomes its own little tag inside the chip, so the
    // viewer can see at a glance which roles a performer has. Empty
    // role set renders no tags (the name alone implies "still picking").
    const tags = r.roles.length
      ? r.roles.map(role => `<span class="role-tag${role === "admin" ? " admin" : ""}">${escHtml(role)}</span>`).join("")
      : "";
    c.innerHTML = `<span class="chip-name">${escHtml(r.name)}${r.connected ? "" : " *"}</span>${tags}`;
    el.appendChild(c);
  });
}

// ── stage / tabs ────────────────────────────────────────────────

const TABS = [
  { id: "motion",   label: "Motion",   render: renderMotionTab   },
  { id: "orient",   label: "Orient",   render: renderOrientTab   },
  { id: "geo",      label: "Location", render: renderGeoTab      },
  { id: "audio",    label: "Audio",    render: renderAudioTab    },
  { id: "camera",   label: "Camera",   render: renderCameraTab   },
  { id: "touch",    label: "Touch",    render: renderTouchTab    },
  { id: "pointer",  label: "Pointer",  render: renderPointerTab  },
  { id: "buttons",  label: "Buttons",  render: renderButtonsTab  },
  { id: "sliders",  label: "Sliders",  render: renderSlidersTab  },
  { id: "keys",     label: "Keyboard", render: renderKeysTab     },
  { id: "midi",     label: "MIDI",     render: renderMidiTab     },
  { id: "gamepad",  label: "Gamepad",  render: renderGamepadTab  },
  { id: "system",   label: "System",   render: renderSystemTab   },
  { id: "wireless", label: "Wireless", render: renderWirelessTab },
  { id: "output",   label: "Output",   render: renderOutputTab   }
];

function currentTabId() {
  const h = (location.hash || "").replace(/^#/, "").trim();
  if (h && TABS.some(t => t.id === h)) return h;
  return TABS[0].id;
}
function setTab(id) {
  location.hash = id;
  render();
}

function renderStage() {
  const youAdmin = lastSnap && lastSnap.you && lastSnap.you.isAdmin;
  const tabId    = currentTabId();
  const tab      = TABS.find(t => t.id === tabId) || TABS[0];
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    ${youAdmin ? `<div class="row"><button class="warn" id="stop-btn" style="flex:1">STOP (back to lobby)</button></div>` : ""}
    <div class="tabbar" id="tabbar">
      ${TABS.map(t => `<div class="tab ${t.id === tabId ? "active" : ""}" data-tab="${t.id}">${escHtml(t.label)}</div>`).join("")}
    </div>
    <div id="tab-body"></div>
    <div class="footer-note">all values stream to Max over WebSocket and as OSC/UDP to <code>${escHtml(location.host)}</code></div>
  `;
  queueMicrotask(() => {
    const stop = wrap.querySelector("#stop-btn");
    if (stop) stop.onclick = sendStop;
    wrap.querySelectorAll("[data-tab]").forEach(el => {
      el.onclick = () => setTab(el.getAttribute("data-tab"));
    });
    const body = wrap.querySelector("#tab-body");
    try { body.appendChild(tab.render()); }
    catch (e) {
      body.innerHTML = `<div class="panel"><div class="err">tab render failed: ${escHtml(e.message)}</div></div>`;
    }
  });
  return wrap;
}

// ── tab helpers ─────────────────────────────────────────────────

function sensorCard(key, title, hint) {
  const on = sensors[key] && sensors[key].on;
  return `
    <div class="sensor ${on ? "on" : ""}" data-sensor="${key}">
      <h3><span>${title}</span><button class="toggle" data-toggle="${key}">${on ? "ON" : "OFF"}</button></h3>
      <div class="v" data-readout="${key}">${escHtml(hint)}</div>
    </div>`;
}

function bindSensorCards(root) {
  root.querySelectorAll("[data-toggle]").forEach(btn => {
    btn.onclick = async () => {
      const key = btn.getAttribute("data-toggle");
      const s   = sensors[key];
      if (!s) return;
      try {
        if (s.on) stopSensor(key);
        else      await startSensor(key);
      } catch (e) {
        readout(key, "denied: " + (e && e.message ? e.message : "?"));
      }
      const card = root.querySelector(`.sensor[data-sensor="${key}"]`);
      if (card) card.classList.toggle("on", s.on);
      btn.textContent = s.on ? "ON" : "OFF";
    };
  });
}

function readout(key, text) {
  const el = document.querySelector(`[data-readout="${key}"]`);
  if (el) el.textContent = text;
}

// ── individual tabs ─────────────────────────────────────────────

function renderMotionTab() {
  const div = document.createElement("div");
  div.className = "cards";
  div.innerHTML =
    sensorCard("motion",   "Acceleration (m/s²)", "ax ay az") +
    sensorCard("gyro",     "Gyroscope (deg/s)",   "rx ry rz") +
    sensorCard("gravity",  "Gravity (m/s²)",      "Generic Sensor — Android/Chrome only") +
    sensorCard("linaccel", "Linear accel",        "Generic Sensor — gravity removed") +
    sensorCard("magnet",   "Magnetometer (µT)",   "Generic Sensor — Android/Chrome only");
  bindSensorCards(div);
  return div;
}

function renderOrientTab() {
  const div = document.createElement("div");
  div.className = "cards";
  div.innerHTML =
    sensorCard("orient",  "Orientation (deg)",     "alpha beta gamma") +
    sensorCard("heading", "Compass heading (deg)", "0–360, clockwise from north");
  bindSensorCards(div);
  return div;
}

function renderGeoTab() {
  const div = document.createElement("div");
  div.className = "cards";
  div.innerHTML = sensorCard("geo", "Geolocation", "lat, lon, alt, accuracy") +
    `<div class="panel"><p>High-accuracy mode (GPS). iOS requires this page be served over HTTPS or via localhost/127.0.0.1 to grant access.</p></div>`;
  bindSensorCards(div);
  return div;
}

function renderAudioTab() {
  const div = document.createElement("div");
  div.className = "cards";
  div.innerHTML =
    sensorCard("mic",    "Microphone level",   "rms peak (0–1)") +
    sensorCard("speech", "Speech-to-text",     "recognized phrases") +
    `<div class="panel"><h2>Waveform</h2><canvas id="mic-wave" width="600" height="80" style="width:100%;height:80px;background:#0a0a0a;border-radius:8px"></canvas></div>`;
  bindSensorCards(div);
  return div;
}

function renderCameraTab() {
  const div = document.createElement("div");
  div.innerHTML =
    sensorCard("camera", "Camera preview", "frames stay on-device by default") +
    `<div class="panel"><video class="video-prev" id="camera-prev" autoplay muted playsinline style="display:none"></video></div>`;
  bindSensorCards(div);
  return div;
}

function renderTouchTab() {
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="panel">
      <h2>Multi-touch pad</h2>
      <p>x and y normalize to 0–1. id is reused (0–15) so OSC addresses stay compact.</p>
      <div class="touchpad" id="touchpad"></div>
      <div class="v" id="touch-readout" style="margin-top:8px;color:var(--muted);font-size:12px;font-family:ui-monospace,Menlo,monospace">0 fingers</div>
    </div>`;
  queueMicrotask(() => bindTouchpad(div.querySelector("#touchpad"), div.querySelector("#touch-readout")));
  return div;
}

function renderPointerTab() {
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="panel">
      <h2>Pointer pad (pen / stylus / mouse)</h2>
      <p>Captures pressure and tilt from Apple Pencil / S Pen / Wacom (where the browser supplies it). Falls back to finger / mouse.</p>
      <div class="touchpad" id="pointer-pad" style="aspect-ratio:16/9"></div>
      <div class="v" id="pointer-readout" style="margin-top:8px;font-family:ui-monospace,Menlo,monospace;font-size:12px">—</div>
    </div>`;
  queueMicrotask(() => bindPointerPad(div.querySelector("#pointer-pad"), div.querySelector("#pointer-readout")));
  return div;
}

function renderButtonsTab() {
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="panel">
      <h2>Pad grid</h2>
      <p>Each pad sends <code>button</code> messages with its id and 0/1 state. Touch-friendly.</p>
      <div class="pad-grid" id="pad-grid">
        ${Array.from({ length: 16 }, (_, i) => `<div class="pad" data-pad="${i}">${i}</div>`).join("")}
      </div>
    </div>`;
  queueMicrotask(() => bindPads(div.querySelector("#pad-grid")));
  return div;
}

function renderSlidersTab() {
  const sliderCount = 4, dialCount = 4;
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="panel">
      <h2>Sliders</h2>
      ${Array.from({ length: sliderCount }, (_, i) => `
        <div class="slider-row">
          <label>slider ${i}</label>
          <input type="range" min="0" max="1" step="0.001" value="0" data-slider="${i}" />
          <div class="v" data-slider-v="${i}">0.000</div>
        </div>`).join("")}
    </div>
    <div class="panel">
      <h2>Dials</h2>
      <div class="dial-grid">
        ${Array.from({ length: dialCount }, (_, i) => `
          <div class="dial-cell">
            <div class="dial" data-dial="${i}"><div class="indicator"></div></div>
            <span class="dial-label" data-dial-v="${i}">dial ${i}: 0.00</span>
          </div>`).join("")}
      </div>
    </div>`;
  queueMicrotask(() => {
    div.querySelectorAll("[data-slider]").forEach(s => {
      const id = Number(s.getAttribute("data-slider"));
      s.addEventListener("input", () => {
        const v = Number(s.value);
        sendSensor("slider", { id, value: v });
        const out = div.querySelector(`[data-slider-v="${id}"]`);
        if (out) out.textContent = v.toFixed(3);
      });
    });
    div.querySelectorAll("[data-dial]").forEach(d => bindDial(d, div));
  });
  return div;
}

function renderKeysTab() {
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="panel text-keyboard">
      <h2>Text keyboard</h2>
      <p>Each keystroke sends a <code>key</code> message; the full text sends as <code>text</code> on every change.</p>
      <textarea id="text-in" placeholder="type here…"></textarea>
    </div>`;
  queueMicrotask(() => {
    const ta = div.querySelector("#text-in");
    ta.addEventListener("input", () => sendSensor("text", { text: ta.value }));
    ta.addEventListener("keydown", (e) => {
      const ch = (e.key && e.key.length === 1) ? e.key : "";
      sendSensor("key", { char: ch, code: e.code || e.key || "" });
    });
  });
  return div;
}

function renderMidiTab() {
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="panel">
      <h2>MIDI keyboard</h2>
      <div class="midi-controls">
        <label>octave</label>
        <button class="ghost" id="oct-down">−</button>
        <span id="oct-display">4</span>
        <button class="ghost" id="oct-up">+</button>
        <label style="margin-left:12px">channel</label>
        <input type="number" id="midi-channel" value="1" min="1" max="16" style="width:60px" />
      </div>
      <div class="midi-keys" id="midi-keys"></div>
      <div class="v" id="midi-readout" style="margin-top:6px;font-family:ui-monospace,Menlo,monospace;font-size:12px">—</div>
    </div>
    <div class="panel">
      <p>Sends <code>midi noteon &lt;note&gt; &lt;vel&gt; &lt;chan&gt;</code> / <code>midi noteoff …</code> via WebSocket and OSC <code>/user/&lt;name&gt;/midi/noteon</code>.</p>
    </div>`;
  queueMicrotask(() => bindMidiKeyboard(div));
  return div;
}

function renderGamepadTab() {
  const div = document.createElement("div");
  div.innerHTML =
    sensorCard("gamepad", "Gamepad", "Connect a controller and press any button — Chrome/Firefox only.") +
    `<div class="panel"><div class="v" id="gp-readout" style="font-family:ui-monospace,Menlo,monospace;font-size:12px;white-space:pre">no gamepad connected</div></div>`;
  bindSensorCards(div);
  return div;
}

function renderSystemTab() {
  const div = document.createElement("div");
  div.className = "cards";
  div.innerHTML =
    sensorCard("battery",   "Battery",            "level, charging — desktop Safari may refuse") +
    sensorCard("net",       "Network",            "type, downlink Mbps") +
    sensorCard("light",     "Ambient light (lx)", "Android Chrome only") +
    sensorCard("screen",    "Screen state",       "orientation, visible, fullscreen") +
    sensorCard("pressure",  "Barometer (hPa)",    "Android Chrome only") +
    sensorCard("proximity", "Proximity",          "Android only — feature-detected");
  bindSensorCards(div);
  return div;
}

function renderWirelessTab() {
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="panel">
      <h2>Web Bluetooth (scan)</h2>
      <p>Tap to scan for one BLE device. Chrome/Android only. iOS Safari does not implement Web Bluetooth.</p>
      <button class="ghost" id="btn-ble">Scan for device</button>
      <div class="v" id="ble-readout" style="margin-top:8px;font-family:ui-monospace,Menlo,monospace;font-size:12px">—</div>
    </div>
    <div class="panel">
      <h2>Web NFC (read tag)</h2>
      <p>Android Chrome only. Tap a tag against the back of the phone after enabling.</p>
      <button class="ghost" id="btn-nfc">Start NFC reader</button>
      <div class="v" id="nfc-readout" style="margin-top:8px;font-family:ui-monospace,Menlo,monospace;font-size:12px">—</div>
    </div>`;
  queueMicrotask(() => bindWireless(div));
  return div;
}

function renderOutputTab() {
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="panel">
      <h2>Display from Max</h2>
      <div class="output-display" id="display-out">—</div>
    </div>
    <div class="panel">
      <h2>Audio output (synth engine)</h2>
      <p>Max controls this from messages like <code>synthnote &lt;note&gt; &lt;vel&gt;</code>, <code>synthset cutoff 2000</code>, <code>synthmode fm</code>.</p>
      <div class="row" style="margin-bottom:8px">
        <button class="ghost" id="audio-init">Tap to enable audio</button>
        <button class="ghost" id="audio-test">Play test note</button>
      </div>
      <div class="row" style="margin-bottom:8px">
        <label style="display:flex;align-items:center;gap:6px">mode
          <select id="audio-mode">
            <option value="osc">osc</option>
            <option value="fm">fm</option>
            <option value="wavetable">wavetable</option>
            <option value="sample">sample</option>
          </select>
        </label>
      </div>
      <div class="v" id="audio-status" style="font-family:ui-monospace,Menlo,monospace;font-size:12px;color:var(--muted)">audio not yet enabled</div>
    </div>
    <div class="panel">
      <h2>Last commands received</h2>
      <div class="v" id="cmd-log" style="font-family:ui-monospace,Menlo,monospace;font-size:11px;white-space:pre-wrap;max-height:160px;overflow:auto">—</div>
    </div>`;
  queueMicrotask(() => {
    div.querySelector("#audio-init").onclick = () => ensureAudio(true);
    div.querySelector("#audio-test").onclick = () => {
      ensureAudio(true);
      handleServerCommand({ cmd: "synthnote", note: 60, vel: 100 });
      setTimeout(() => handleServerCommand({ cmd: "synthnote", note: 60, vel: 0 }), 400);
    };
    div.querySelector("#audio-mode").onchange = (e) => handleServerCommand({ cmd: "synthmode", mode: e.target.value });
    refreshAudioStatus();
  });
  return div;
}

// ── sensor start/stop ───────────────────────────────────────────

async function startSensor(key) {
  switch (key) {
    case "motion":    sensors.motion.on    = true; await ensureMotionListener(); break;
    case "gyro":      sensors.gyro.on      = true; await ensureMotionListener(); break;
    case "orient":    sensors.orient.on    = true; await ensureOrientListener(); break;
    case "heading":   sensors.heading.on   = true; await ensureOrientListener(); break;
    case "gravity":   startGeneric("gravity",  "Gravity",        16); break;
    case "linaccel":  startGeneric("linaccel", "LinearAccel",    16); break;
    case "magnet":    startGeneric("magnet",   "Magnetometer",   10); break;
    case "pressure":  startGeneric("pressure", "Pressure",        2); break;
    case "proximity": startProximity(); break;
    case "geo":       startGeo(); break;
    case "mic":       await startMic(); break;
    case "speech":    startSpeech(); break;
    case "camera":    await startCamera(); break;
    case "gamepad":   startGamepad(); break;
    case "battery":   await startBattery(); break;
    case "net":       startNet(); break;
    case "light":     startLight(); break;
    case "screen":    startScreen(); break;
  }
}

function stopSensor(key) {
  const s = sensors[key];
  s.on = false;
  switch (key) {
    case "motion":
    case "gyro":      maybeStopMotionListener(); break;
    case "orient":
    case "heading":   maybeStopOrientListener(); break;
    case "gravity":
    case "linaccel":
    case "magnet":
    case "pressure":  if (s.sensor) { try { s.sensor.stop(); } catch (_) {} } s.sensor = null; break;
    case "proximity": break;
    case "geo":
      if (s.watchId != null) navigator.geolocation.clearWatch(s.watchId);
      s.watchId = null; break;
    case "mic":
      cancelAnimationFrame(s.raf);
      if (s.ctx)    { try { s.ctx.close(); } catch (_) {} }
      if (s.stream) s.stream.getTracks().forEach(t => t.stop());
      s.ctx = null; s.stream = null; s.analyser = null; break;
    case "speech":
      if (s.rec) { try { s.rec.stop(); } catch (_) {} }
      s.rec = null; break;
    case "camera":
      if (s.stream) s.stream.getTracks().forEach(t => t.stop());
      s.stream = null;
      const v = document.getElementById("camera-prev");
      if (v) { v.srcObject = null; v.style.display = "none"; }
      break;
    case "gamepad":
      cancelAnimationFrame(s.raf); s.raf = 0; break;
    case "battery":
      if (s.ref && s.push) {
        s.ref.removeEventListener("levelchange",    s.push);
        s.ref.removeEventListener("chargingchange", s.push);
      }
      s.ref = null; s.push = null; break;
    case "net":
      if (s.ref && s.push) s.ref.removeEventListener && s.ref.removeEventListener("change", s.push);
      s.ref = null; s.push = null; break;
    case "light":
      if (s.sensor) { try { s.sensor.stop(); } catch (_) {} }
      s.sensor = null; break;
    case "screen":
      if (s.push) {
        document.removeEventListener("visibilitychange", s.push);
        window.removeEventListener("resize", s.push);
        document.removeEventListener("fullscreenchange", s.push);
        if (s.mql && s.mql.removeEventListener) s.mql.removeEventListener("change", s.push);
      }
      s.push = null; s.mql = null; break;
  }
}

// iOS Safari requires explicit permission grants for motion/orientation
// events, and those grant calls must happen inside a user-gesture handler.
async function requestMotionPerm() {
  if (typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function") {
    const r = await DeviceMotionEvent.requestPermission();
    if (r !== "granted") throw new Error("motion permission denied");
  }
}
async function requestOrientPerm() {
  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {
    const r = await DeviceOrientationEvent.requestPermission();
    if (r !== "granted") throw new Error("orientation permission denied");
  }
}

let motionHandler = null, orientHandler = null;

async function ensureMotionListener() {
  if (motionHandler) return;
  await requestMotionPerm();
  motionHandler = (e) => {
    const now = performance.now();
    if (sensors.motion.on) {
      const s = sensors.motion;
      if (now - s.lastSent >= s.intervalMs) {
        s.lastSent = now;
        const a = e.acceleration || {};
        const ax = a.x || 0, ay = a.y || 0, az = a.z || 0;
        sendSensor("motion", { ax, ay, az });
        readout("motion", `${ax.toFixed(2)} ${ay.toFixed(2)} ${az.toFixed(2)}`);
      }
    }
    if (sensors.gyro.on) {
      const s = sensors.gyro;
      if (now - s.lastSent >= s.intervalMs) {
        s.lastSent = now;
        const r = e.rotationRate || {};
        const rx = r.alpha || 0, ry = r.beta || 0, rz = r.gamma || 0;
        sendSensor("gyro", { rx, ry, rz });
        readout("gyro", `${rx.toFixed(1)} ${ry.toFixed(1)} ${rz.toFixed(1)}`);
      }
    }
  };
  window.addEventListener("devicemotion", motionHandler);
}
function maybeStopMotionListener() {
  if (!motionHandler) return;
  if (sensors.motion.on || sensors.gyro.on) return;
  window.removeEventListener("devicemotion", motionHandler);
  motionHandler = null;
}

async function ensureOrientListener() {
  if (orientHandler) return;
  await requestOrientPerm();
  orientHandler = (e) => {
    const now = performance.now();
    if (sensors.orient.on) {
      const s = sensors.orient;
      if (now - s.lastSent >= s.intervalMs) {
        s.lastSent = now;
        const alpha = e.alpha || 0, beta = e.beta || 0, gamma = e.gamma || 0;
        sendSensor("orient", { alpha, beta, gamma });
        readout("orient", `${alpha.toFixed(1)} ${beta.toFixed(1)} ${gamma.toFixed(1)}`);
      }
    }
    if (sensors.heading.on) {
      const s = sensors.heading;
      if (now - s.lastSent >= s.intervalMs) {
        s.lastSent = now;
        const h = (typeof e.webkitCompassHeading === "number") ? e.webkitCompassHeading
                : (360 - (e.alpha || 0));
        sendSensor("heading", { heading: h });
        readout("heading", h.toFixed(1));
      }
    }
  };
  window.addEventListener("deviceorientation", orientHandler);
}
function maybeStopOrientListener() {
  if (!orientHandler) return;
  if (sensors.orient.on || sensors.heading.on) return;
  window.removeEventListener("deviceorientation", orientHandler);
  orientHandler = null;
}

// Generic Sensor API — Chromium-only. Uses a single helper for the four
// kinds with the same shape (Gravity/LinearAccel/Magnetometer/Pressure).
function startGeneric(key, ctorName, freq) {
  const Ctor = window[ctorName + "Sensor"] || window[ctorName];
  if (typeof Ctor !== "function") throw new Error(`no ${ctorName}Sensor (Chrome/Android only)`);
  const s = sensors[key];
  const sensor = new Ctor({ frequency: freq });
  sensor.onreading = () => {
    if (key === "gravity") {
      sendSensor("gravity", { gx: sensor.x, gy: sensor.y, gz: sensor.z });
      readout("gravity", `${sensor.x.toFixed(2)} ${sensor.y.toFixed(2)} ${sensor.z.toFixed(2)}`);
    } else if (key === "linaccel") {
      sendSensor("linaccel", { ax: sensor.x, ay: sensor.y, az: sensor.z });
      readout("linaccel", `${sensor.x.toFixed(2)} ${sensor.y.toFixed(2)} ${sensor.z.toFixed(2)}`);
    } else if (key === "magnet") {
      sendSensor("magnet", { mx: sensor.x, my: sensor.y, mz: sensor.z });
      readout("magnet", `${sensor.x.toFixed(1)} ${sensor.y.toFixed(1)} ${sensor.z.toFixed(1)}`);
    } else if (key === "pressure") {
      sendSensor("pressure", { hpa: sensor.pressure });
      readout("pressure", `${sensor.pressure.toFixed(2)} hPa`);
    }
  };
  sensor.onerror = (e) => readout(key, "err: " + (e.error && e.error.message || e.message || "?"));
  sensor.start();
  s.on = true; s.sensor = sensor;
}

// Proximity sensor: the standard API was removed from most browsers, but the
// experimental ProximitySensor still exists on a few Android builds. Falls
// back to a deprecated `userproximity` event that some phones still fire.
function startProximity() {
  if (typeof ProximitySensor === "function") {
    const sensor = new ProximitySensor({ frequency: 5 });
    sensor.onreading = () => {
      sendSensor("proximity", { dist: sensor.distance, max: sensor.max });
      readout("proximity", `${sensor.distance} / ${sensor.max}`);
    };
    sensor.onerror = (e) => readout("proximity", "err: " + (e.error && e.error.message || e.message || "?"));
    sensor.start();
    sensors.proximity.on = true; sensors.proximity.sensor = sensor;
  } else if ("ondeviceproximity" in window) {
    const handler = (e) => {
      sendSensor("proximity", { dist: e.value, max: e.max });
      readout("proximity", `${e.value} / ${e.max}`);
    };
    window.addEventListener("deviceproximity", handler);
    sensors.proximity.on = true;
    sensors.proximity.handler = handler;
  } else {
    throw new Error("no ProximitySensor (Android only, and rarely)");
  }
}

function startGeo() {
  if (!navigator.geolocation) throw new Error("no geolocation");
  sensors.geo.on = true;
  sensors.geo.watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      const alt = pos.coords.altitude || 0, accuracy = pos.coords.accuracy || 0;
      sendSensor("geo", { lat, lon, alt, accuracy });
      readout("geo", `${lat.toFixed(5)}, ${lon.toFixed(5)}  ±${Math.round(accuracy)}m`);
    },
    (err) => readout("geo", "err: " + err.message),
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
  );
}

async function startMic() {
  const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx      = new (window.AudioContext || window.webkitAudioContext)();
  const src      = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  src.connect(analyser);
  sensors.mic.on = true; sensors.mic.ctx = ctx; sensors.mic.stream = stream; sensors.mic.analyser = analyser;
  const buf = new Float32Array(analyser.fftSize);
  const canvas = document.getElementById("mic-wave");
  const gctx = canvas ? canvas.getContext("2d") : null;
  let lastSent = 0;
  function loop() {
    if (!sensors.mic.on) return;
    analyser.getFloatTimeDomainData(buf);
    let sum = 0, peak = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i]; sum += v * v; const av = v < 0 ? -v : v; if (av > peak) peak = av;
    }
    const level = Math.sqrt(sum / buf.length);
    const now = performance.now();
    if (now - lastSent >= 50) {
      lastSent = now;
      sendSensor("mic", { level, peak });
      readout("mic", `lvl ${level.toFixed(3)}  pk ${peak.toFixed(3)}`);
    }
    if (gctx) drawWaveform(gctx, canvas, buf);
    sensors.mic.raf = requestAnimationFrame(loop);
  }
  loop();
}

function drawWaveform(gctx, canvas, buf) {
  const w = canvas.width, h = canvas.height;
  gctx.fillStyle = "#0a0a0a"; gctx.fillRect(0, 0, w, h);
  gctx.strokeStyle = "#6cd06c"; gctx.lineWidth = 1.5; gctx.beginPath();
  for (let i = 0; i < buf.length; i++) {
    const x = (i / buf.length) * w;
    const y = (1 - (buf[i] + 1) / 2) * h;
    if (i === 0) gctx.moveTo(x, y); else gctx.lineTo(x, y);
  }
  gctx.stroke();
}

function startSpeech() {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) throw new Error("no SpeechRecognition");
  const rec = new Ctor();
  rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
  rec.onresult = (ev) => {
    let text = "", isFinal = false;
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i];
      text += r[0].transcript;
      if (r.isFinal) isFinal = true;
    }
    sendSensor("speech", { text, final: isFinal });
    readout("speech", (isFinal ? "[final] " : "[…] ") + text);
  };
  rec.onerror = (e) => readout("speech", "err: " + e.error);
  rec.onend   = () => { if (sensors.speech.on) try { rec.start(); } catch (_) {} };
  rec.start();
  sensors.speech.on = true; sensors.speech.rec = rec;
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
  sensors.camera.on = true; sensors.camera.stream = stream;
  const v = document.getElementById("camera-prev");
  if (v) { v.srcObject = stream; v.style.display = "block"; }
  readout("camera", "preview live — frames stay on-device until you wire a sender");
}

function startGamepad() {
  const s = sensors.gamepad;
  s.on = true;
  const out = document.getElementById("gp-readout");
  let lastSent = 0;
  function poll() {
    if (!s.on) return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const p of pads) if (p) { gp = p; break; }
    if (gp) {
      const axes    = gp.axes.slice();
      const buttons = gp.buttons.map(b => b.value);
      const now = performance.now();
      if (now - lastSent >= 33) {
        lastSent = now;
        sendSensor("gamepad", { axes, buttons });
      }
      if (out) out.textContent =
        `${gp.id}\naxes: ${axes.map(a => a.toFixed(2)).join(" ")}\nbtns: ${buttons.map(b => b.toFixed(2)).join(" ")}`;
      readout("gamepad", `${axes.length} axes  ${buttons.length} buttons`);
    } else {
      if (out) out.textContent = "no gamepad connected";
      readout("gamepad", "no gamepad");
    }
    s.raf = requestAnimationFrame(poll);
  }
  poll();
}

async function startBattery() {
  if (!navigator.getBattery) throw new Error("no battery API");
  const b = await navigator.getBattery();
  const s = sensors.battery; s.on = true; s.ref = b;
  s.push = () => {
    if (!s.on) return;
    sendSensor("battery", { level: b.level, charging: b.charging });
    readout("battery", `${Math.round(b.level * 100)}%${b.charging ? " ⚡" : ""}`);
  };
  s.push();
  b.addEventListener("levelchange",    s.push);
  b.addEventListener("chargingchange", s.push);
}

function startNet() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!c) throw new Error("no Network Information API");
  const s = sensors.net; s.on = true; s.ref = c;
  s.push = () => {
    if (!s.on) return;
    const t = c.effectiveType || c.type || "unknown";
    sendSensor("net", { netType: t, downlink: c.downlink || 0 });
    readout("net", `${t}  ${c.downlink || 0} Mbps`);
  };
  s.push();
  c.addEventListener && c.addEventListener("change", s.push);
}

function startLight() {
  if (typeof AmbientLightSensor !== "function") throw new Error("no AmbientLightSensor");
  const sensor = new AmbientLightSensor({ frequency: 4 });
  sensor.onreading = () => {
    sendSensor("light", { lux: sensor.illuminance });
    readout("light", `${sensor.illuminance} lx`);
  };
  sensor.onerror = (e) => readout("light", "err: " + (e.error && e.error.message || e.message || "?"));
  sensor.start();
  sensors.light.on = true; sensors.light.sensor = sensor;
}

function startScreen() {
  const s = sensors.screen; s.on = true;
  const mql = window.matchMedia ? window.matchMedia("(orientation: portrait)") : null;
  s.mql = mql;
  s.push = () => {
    if (!s.on) return;
    const orientation = (mql && mql.matches) ? "portrait" : "landscape";
    const visible    = document.visibilityState === "visible";
    const fullscreen = !!document.fullscreenElement;
    sendSensor("screen", { orientation, visible, fullscreen });
    readout("screen", `${orientation}  vis=${visible ? 1 : 0}  fs=${fullscreen ? 1 : 0}`);
  };
  s.push();
  document.addEventListener("visibilitychange", s.push);
  window.addEventListener("resize", s.push);
  document.addEventListener("fullscreenchange", s.push);
  if (mql && mql.addEventListener) mql.addEventListener("change", s.push);
}

// ── touch / pointer / pads / dials / midi ───────────────────────

function bindTouchpad(pad, readoutEl) {
  if (!pad) return;
  // Reuse the global touchState so re-renders don't lose active fingers.
  const dots = new Map();
  const rect = () => pad.getBoundingClientRect();
  function sendAll() {
    const r = rect();
    const arr = [];
    touchState.active.forEach((t) => {
      arr.push({
        i: t.idx,
        x: (t.clientX - r.left) / r.width,
        y: (t.clientY - r.top)  / r.height,
        force: t.force || 0
      });
    });
    sendSensor("touch", { touches: arr });
    if (readoutEl) readoutEl.textContent = arr.length
      ? arr.map(t => `${t.i}: ${t.x.toFixed(2)}, ${t.y.toFixed(2)}`).join("\n")
      : "0 fingers";
  }
  function nextIdx() {
    const used = new Set();
    touchState.active.forEach(t => used.add(t.idx));
    for (let i = 0; i < 16; i++) if (!used.has(i)) return i;
    return 15;
  }
  function paintDot(id, t) {
    let dot = dots.get(id);
    if (!dot) {
      dot = document.createElement("div");
      dot.className = "dot";
      dot.innerHTML = `<span>${t.idx}</span>`;
      pad.appendChild(dot);
      dots.set(id, dot);
    }
    const r = rect();
    dot.style.left = (t.clientX - r.left) + "px";
    dot.style.top  = (t.clientY - r.top)  + "px";
  }
  function removeDot(id) {
    const d = dots.get(id);
    if (d) { d.remove(); dots.delete(id); }
  }
  pad.addEventListener("touchstart", (e) => {
    e.preventDefault();
    for (const tt of e.changedTouches) {
      const idx = nextIdx();
      const t = { idx, clientX: tt.clientX, clientY: tt.clientY, force: tt.force || 0 };
      touchState.active.set(tt.identifier, t);
      paintDot(tt.identifier, t);
    }
    sendAll();
  }, { passive: false });
  pad.addEventListener("touchmove", (e) => {
    e.preventDefault();
    for (const tt of e.changedTouches) {
      const t = touchState.active.get(tt.identifier);
      if (!t) continue;
      t.clientX = tt.clientX; t.clientY = tt.clientY; t.force = tt.force || 0;
      paintDot(tt.identifier, t);
    }
    sendAll();
  }, { passive: false });
  const end = (e) => {
    for (const tt of e.changedTouches) {
      touchState.active.delete(tt.identifier);
      removeDot(tt.identifier);
    }
    sendAll();
  };
  pad.addEventListener("touchend",    end);
  pad.addEventListener("touchcancel", end);
  pad.addEventListener("mousedown", (e) => {
    const idx = nextIdx();
    const t = { idx, clientX: e.clientX, clientY: e.clientY, force: 0.5 };
    touchState.active.set("_mouse", t); paintDot("_mouse", t); sendAll();
  });
  window.addEventListener("mousemove", (e) => {
    const t = touchState.active.get("_mouse"); if (!t) return;
    t.clientX = e.clientX; t.clientY = e.clientY; paintDot("_mouse", t); sendAll();
  });
  window.addEventListener("mouseup", () => {
    if (!touchState.active.has("_mouse")) return;
    touchState.active.delete("_mouse"); removeDot("_mouse"); sendAll();
  });
}

function bindPointerPad(pad, readoutEl) {
  if (!pad || !window.PointerEvent) {
    if (readoutEl) readoutEl.textContent = "no PointerEvent in this browser";
    return;
  }
  const rect = () => pad.getBoundingClientRect();
  function emit(e) {
    const r = rect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top)  / r.height;
    const data = {
      x, y,
      pressure: e.pressure || 0,
      tiltX:    e.tiltX || 0,
      tiltY:    e.tiltY || 0,
      ptype:    e.pointerType || "touch"
    };
    sendSensor("pointer", data);
    if (readoutEl) readoutEl.textContent =
      `${data.ptype}  x=${x.toFixed(3)} y=${y.toFixed(3)}  p=${data.pressure.toFixed(2)}  tilt=${data.tiltX.toFixed(0)},${data.tiltY.toFixed(0)}`;
  }
  pad.addEventListener("pointerdown", (e) => { e.preventDefault(); pad.setPointerCapture(e.pointerId); emit(e); });
  pad.addEventListener("pointermove", (e) => { if (e.buttons || e.pressure > 0) emit(e); });
  pad.addEventListener("pointerup",   (e) => { emit(e); });
}

function bindPads(grid) {
  if (!grid) return;
  const press = (el, down) => {
    const id = Number(el.getAttribute("data-pad"));
    el.classList.toggle("down", !!down);
    sendSensor("button", { id, value: down ? 1 : 0 });
  };
  grid.querySelectorAll(".pad").forEach(p => {
    p.addEventListener("touchstart", (e) => { e.preventDefault(); press(p, true);  }, { passive: false });
    p.addEventListener("touchend",   (e) => { e.preventDefault(); press(p, false); }, { passive: false });
    p.addEventListener("mousedown",  () => press(p, true));
    p.addEventListener("mouseup",    () => press(p, false));
    p.addEventListener("mouseleave", () => { if (p.classList.contains("down")) press(p, false); });
  });
}

function bindDial(el, root) {
  const id = Number(el.getAttribute("data-dial"));
  const indicator = el.querySelector(".indicator");
  const label     = root.querySelector(`[data-dial-v="${id}"]`);
  // Value 0..1 maps to -135deg..+135deg of rotation. Dial drags vertically.
  let value = 0;
  let dragging = false;
  let startY = 0, startV = 0;
  function set(v) {
    value = Math.max(0, Math.min(1, v));
    const deg = -135 + value * 270;
    if (indicator) indicator.style.transform = `translateX(-50%) rotate(${deg}deg)`;
    if (label) label.textContent = `dial ${id}: ${value.toFixed(2)}`;
    sendSensor("dial", { id, value });
  }
  set(0);
  const begin = (clientY) => { dragging = true; startY = clientY; startV = value; };
  const move  = (clientY) => { if (!dragging) return; set(startV + (startY - clientY) / 200); };
  const end   = () => { dragging = false; };
  el.addEventListener("touchstart", (e) => { e.preventDefault(); begin(e.touches[0].clientY); }, { passive: false });
  el.addEventListener("touchmove",  (e) => { e.preventDefault(); move(e.touches[0].clientY);  }, { passive: false });
  el.addEventListener("touchend",   end);
  el.addEventListener("mousedown",  (e) => { begin(e.clientY); });
  window.addEventListener("mousemove", (e) => move(e.clientY));
  window.addEventListener("mouseup",   end);
}

function bindMidiKeyboard(root) {
  const keysEl    = root.querySelector("#midi-keys");
  const readout   = root.querySelector("#midi-readout");
  const octEl     = root.querySelector("#oct-display");
  const channelEl = root.querySelector("#midi-channel");
  let octave = 4;
  const lowNote = () => octave * 12;
  // Two octaves of keys = 14 white keys, 10 black keys
  const whitePattern = ["C","D","E","F","G","A","B","C","D","E","F","G","A","B"];
  const blackPositions = [0,1,3,4,5,7,8,10,11,12]; // indexes (relative to white-key index 0) where black keys sit AFTER that white
  // Map: whiteIdx → semitone offset
  const whiteSemitones = [0,2,4,5,7,9,11,12,14,16,17,19,21,23];
  const blackSemitones = [1,3,6,8,10,13,15,18,20,22];
  const active = new Map(); // pointerId → noteNumber

  function rebuild() {
    keysEl.innerHTML = "";
    const w = keysEl.clientWidth;
    const whiteW = w / 14;
    whiteSemitones.forEach((semi, i) => {
      const k = document.createElement("div");
      k.className = "midi-key white";
      k.style.left  = (i * whiteW) + "px";
      k.style.width = whiteW + "px";
      k.dataset.note = String(lowNote() + semi);
      k.textContent = (i % 7 === 0) ? (whitePattern[i] + (octave + Math.floor(i / 7))) : "";
      keysEl.appendChild(k);
    });
    const blackW = whiteW * 0.6;
    const blackOffsets = [0.7, 1.7, 3.7, 4.7, 5.7, 7.7, 8.7, 10.7, 11.7, 12.7];
    blackSemitones.forEach((semi, i) => {
      const k = document.createElement("div");
      k.className = "midi-key black";
      k.style.left  = (blackOffsets[i] * whiteW - blackW / 2) + "px";
      k.style.width = blackW + "px";
      k.style.height = "60%";
      k.dataset.note = String(lowNote() + semi);
      keysEl.appendChild(k);
    });
  }
  function noteAt(clientX, clientY) {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el || !el.classList || !el.classList.contains("midi-key")) return null;
    return { el, note: Number(el.dataset.note) };
  }
  function setKeyState(el, down) { el.classList.toggle("down", !!down); }
  function noteOn(note, el) {
    const channel = Math.max(1, Math.min(16, Number(channelEl.value) || 1));
    setKeyState(el, true);
    sendSensor("midi", { event: "noteon", note, vel: 100, channel });
    if (readout) readout.textContent = `noteon ${note} ch${channel}`;
  }
  function noteOff(note, el) {
    const channel = Math.max(1, Math.min(16, Number(channelEl.value) || 1));
    setKeyState(el, false);
    sendSensor("midi", { event: "noteoff", note, vel: 0, channel });
    if (readout) readout.textContent = `noteoff ${note} ch${channel}`;
  }

  keysEl.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const hit = noteAt(e.clientX, e.clientY);
    if (!hit) return;
    keysEl.setPointerCapture(e.pointerId);
    active.set(e.pointerId, { note: hit.note, el: hit.el });
    noteOn(hit.note, hit.el);
  });
  keysEl.addEventListener("pointermove", (e) => {
    const cur = active.get(e.pointerId); if (!cur) return;
    const hit = noteAt(e.clientX, e.clientY);
    if (!hit || hit.note === cur.note) return;
    noteOff(cur.note, cur.el);
    active.set(e.pointerId, { note: hit.note, el: hit.el });
    noteOn(hit.note, hit.el);
  });
  const release = (e) => {
    const cur = active.get(e.pointerId); if (!cur) return;
    noteOff(cur.note, cur.el);
    active.delete(e.pointerId);
  };
  keysEl.addEventListener("pointerup",     release);
  keysEl.addEventListener("pointercancel", release);
  keysEl.addEventListener("pointerleave",  release);

  root.querySelector("#oct-down").onclick = () => { octave = Math.max(0, octave - 1); octEl.textContent = octave; rebuild(); };
  root.querySelector("#oct-up").onclick   = () => { octave = Math.min(8, octave + 1); octEl.textContent = octave; rebuild(); };
  // Wait one frame for layout, then size keys.
  requestAnimationFrame(rebuild);
}

function bindWireless(root) {
  const bleBtn = root.querySelector("#btn-ble");
  const bleOut = root.querySelector("#ble-readout");
  bleBtn.onclick = async () => {
    if (!navigator.bluetooth) { bleOut.textContent = "Web Bluetooth not supported (iOS Safari does not support it)"; return; }
    try {
      const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
      bleOut.textContent = `device: ${device.name || "(unnamed)"}  id: ${device.id}`;
      // We don't send BLE telemetry as a stream — too device-specific — but
      // a discovery event is informative for the patch.
      sendSensor("button", { id: 999, value: 1 }); // marker
    } catch (e) {
      bleOut.textContent = "scan: " + e.message;
    }
  };

  const nfcBtn = root.querySelector("#btn-nfc");
  const nfcOut = root.querySelector("#nfc-readout");
  nfcBtn.onclick = async () => {
    if (typeof NDEFReader !== "function") { nfcOut.textContent = "Web NFC not supported (Android Chrome only)"; return; }
    try {
      const reader = new NDEFReader();
      await reader.scan();
      nfcOut.textContent = "scanning…";
      reader.onreading = (ev) => {
        const records = (ev.message && ev.message.records) || [];
        const txt = records.map(r => { try { return new TextDecoder().decode(r.data); } catch (_) { return "[binary]"; } }).join(" | ");
        nfcOut.textContent = `serial: ${ev.serialNumber || "?"}\n${txt}`;
        sendSensor("text", { text: txt });
      };
      sensors.nfc.on = true; sensors.nfc.reader = reader;
    } catch (e) {
      nfcOut.textContent = "nfc: " + e.message;
    }
  };
}

// ── Max → phone commands ────────────────────────────────────────

const cmdLog = [];

function handleServerCommand(msg) {
  cmdLog.unshift(`${new Date().toLocaleTimeString()}  ${JSON.stringify(msg)}`);
  if (cmdLog.length > 20) cmdLog.length = 20;
  const log = document.getElementById("cmd-log");
  if (log) log.textContent = cmdLog.join("\n");
  switch (msg.cmd) {
    case "vibrate":
      if (navigator.vibrate) navigator.vibrate(Math.max(0, Number(msg.ms) || 0));
      break;
    case "speak": {
      if (!("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(String(msg.text || ""));
      window.speechSynthesis.speak(u);
      break;
    }
    case "beep":
      ensureAudio();
      playBeep(Number(msg.freq) || 440, Number(msg.ms) || 100);
      break;
    case "display": {
      const out = document.getElementById("display-out");
      if (out) {
        out.textContent = String(msg.text || "");
        out.classList.add("flash");
        setTimeout(() => out.classList.remove("flash"), 200);
      }
      break;
    }
    case "synthnote":
      ensureAudio();
      synthNote(Number(msg.note) || 0, Number(msg.vel) || 0);
      break;
    case "synthset":
      ensureAudio();
      synthSet(String(msg.param), Number(msg.value) || 0);
      break;
    case "synthmode":
      ensureAudio();
      synthMode(String(msg.mode));
      break;
  }
}

// ── audio output / synth engine ─────────────────────────────────

function ensureAudio(force) {
  if (audio.ctx) {
    if (audio.ctx.state === "suspended" && force) audio.ctx.resume();
    return;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  audio.ctx = new Ctx();
  audio.master = audio.ctx.createGain();
  audio.master.gain.value = 0.3;
  audio.master.connect(audio.ctx.destination);
  refreshAudioStatus();
}

function refreshAudioStatus() {
  const el = document.getElementById("audio-status"); if (!el) return;
  if (!audio.ctx) { el.textContent = "audio not yet enabled — tap the button above"; return; }
  el.textContent =
    `mode=${audio.mode}  ctx=${audio.ctx.state}  sr=${audio.ctx.sampleRate}\n` +
    Object.keys(audio.params).map(k => `${k}=${audio.params[k]}`).join("  ");
  const sel = document.getElementById("audio-mode");
  if (sel) sel.value = audio.mode;
}

function midiToHz(note) { return 440 * Math.pow(2, (note - 69) / 12); }

function synthMode(mode) {
  if (!["osc","fm","wavetable","sample"].includes(mode)) return;
  audio.mode = mode;
  refreshAudioStatus();
}

function synthSet(param, value) {
  if (!(param in audio.params)) { /* unknown but allow free-form */ audio.params[param] = value; refreshAudioStatus(); return; }
  audio.params[param] = value;
  refreshAudioStatus();
  // If the param affects an active voice, apply it live.
  const v = audio.voice;
  if (v && v.filter && param === "cutoff") v.filter.frequency.value = value;
  if (v && v.filter && param === "q")      v.filter.Q.value         = value;
  if (v && v.modGain && param === "modIndex") v.modGain.gain.value  = value;
  if (v && v.mod && v.carrier && param === "modRatio") v.mod.frequency.value = midiToHz(v.note) * value;
}

function synthNote(note, vel) {
  if (!audio.ctx) return;
  // vel=0 ⇒ note-off. We use a monophonic voice for the template; Max can
  // multiplex by sending to multiple phones if it wants polyphony.
  if (vel === 0) {
    releaseVoice();
    return;
  }
  releaseVoice();
  switch (audio.mode) {
    case "osc":       audio.voice = voiceOsc(note, vel);       break;
    case "fm":        audio.voice = voiceFm(note, vel);        break;
    case "wavetable": audio.voice = voiceWavetable(note, vel); break;
    case "sample":    audio.voice = voiceSample(note, vel);    break;
  }
}

function makeAdsr(amp, vel) {
  const ctx = audio.ctx;
  const now = ctx.currentTime;
  amp.gain.cancelScheduledValues(now);
  amp.gain.setValueAtTime(0, now);
  amp.gain.linearRampToValueAtTime(vel / 127, now + Math.max(0.001, audio.params.attack));
}

function releaseVoice() {
  const v = audio.voice; if (!v) return;
  const ctx = audio.ctx; const now = ctx.currentTime;
  const rel = Math.max(0.01, audio.params.release);
  try {
    v.amp.gain.cancelScheduledValues(now);
    v.amp.gain.setTargetAtTime(0, now, rel / 3);
    // Stop oscillators after release tail
    setTimeout(() => { try { v.stop && v.stop(); } catch (_) {} }, rel * 1000 + 100);
  } catch (_) {}
  audio.voice = null;
}

function voiceOsc(note, vel) {
  const ctx = audio.ctx;
  const osc = ctx.createOscillator();
  osc.type = audio.params.waveform;
  osc.frequency.value = midiToHz(note);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = audio.params.cutoff;
  filter.Q.value = audio.params.q;
  const amp = ctx.createGain(); amp.gain.value = 0;
  osc.connect(filter).connect(amp).connect(audio.master);
  osc.start();
  makeAdsr(amp, vel);
  return { note, amp, filter, osc, stop: () => osc.stop() };
}

function voiceFm(note, vel) {
  const ctx = audio.ctx;
  const carrier = ctx.createOscillator();
  const mod     = ctx.createOscillator();
  const modGain = ctx.createGain();
  const amp     = ctx.createGain(); amp.gain.value = 0;
  const filter  = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = audio.params.cutoff;
  filter.Q.value = audio.params.q;
  const carrierHz = midiToHz(note);
  carrier.frequency.value = carrierHz;
  mod.frequency.value     = carrierHz * audio.params.modRatio;
  modGain.gain.value      = audio.params.modIndex;
  mod.connect(modGain).connect(carrier.frequency);
  carrier.connect(filter).connect(amp).connect(audio.master);
  carrier.start(); mod.start();
  makeAdsr(amp, vel);
  return { note, amp, filter, mod, modGain, carrier, stop: () => { carrier.stop(); mod.stop(); } };
}

// Wavetable mode uses a custom PeriodicWave built from a few harmonics —
// gives a brighter, more digital character than the built-in osc types.
let cachedWavetable = null;
function voiceWavetable(note, vel) {
  const ctx = audio.ctx;
  if (!cachedWavetable) {
    const real = new Float32Array(16);
    const imag = new Float32Array(16);
    // Bell-ish partials
    [1, 2.76, 5.4, 8.93].forEach((p, i) => {
      const idx = Math.round(p);
      if (idx < real.length) imag[idx] = 1 / (i + 1);
    });
    cachedWavetable = ctx.createPeriodicWave(real, imag);
  }
  const osc = ctx.createOscillator();
  osc.setPeriodicWave(cachedWavetable);
  osc.frequency.value = midiToHz(note);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = audio.params.cutoff;
  filter.Q.value = audio.params.q;
  const amp = ctx.createGain(); amp.gain.value = 0;
  osc.connect(filter).connect(amp).connect(audio.master);
  osc.start();
  makeAdsr(amp, vel);
  return { note, amp, filter, osc, stop: () => osc.stop() };
}

async function loadSample(url) {
  if (!audio.ctx) ensureAudio(true);
  if (!url) return null;
  try {
    const r = await fetch(url);
    const buf = await r.arrayBuffer();
    audio.sampleBuffer = await audio.ctx.decodeAudioData(buf);
    return audio.sampleBuffer;
  } catch (e) {
    return null;
  }
}

function voiceSample(note, vel) {
  const ctx = audio.ctx;
  if (audio.params.sampleUrl && !audio.sampleBuffer) loadSample(audio.params.sampleUrl);
  if (!audio.sampleBuffer) {
    // Fall back to a sine click so silence isn't a confusing failure.
    return voiceOsc(note, vel);
  }
  const src = ctx.createBufferSource();
  src.buffer = audio.sampleBuffer;
  // Pitch sample by ratio from a nominal root note of 60.
  src.playbackRate.value = Math.pow(2, (note - 60) / 12);
  const amp = ctx.createGain(); amp.gain.value = 0;
  src.connect(amp).connect(audio.master);
  src.start();
  makeAdsr(amp, vel);
  return { note, amp, src, stop: () => src.stop() };
}

function playBeep(freq, ms) {
  if (!audio.ctx) return;
  const o = audio.ctx.createOscillator();
  const g = audio.ctx.createGain();
  o.frequency.value = freq;
  g.gain.value = 0.0001;
  o.connect(g).connect(audio.master);
  const t0 = audio.ctx.currentTime;
  g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
  o.start();
  o.stop(t0 + ms / 1000 + 0.05);
}

// ── render & boot ───────────────────────────────────────────────

function render() {
  updateHeader();
  const main = document.getElementById("main");
  main.innerHTML = "";
  if (isLanding) { main.appendChild(renderLanding()); return; }
  if (isAudience) {
    if (!myName) { main.appendChild(renderAudienceJoin()); return; }
    main.appendChild(renderAudienceMain());
    return;
  }
  if (!myName)                       { main.appendChild(renderJoin());  return; }
  if (lastSnap && lastSnap.started)  { main.appendChild(renderStage()); return; }
  main.appendChild(renderLobby());
}

// Public-host landing — shown when someone visits the Pages URL
// directly without join params. Explains the model and offers links
// out (back to the projects index and to the source repo) so the
// visitor isn't stranded on a perpetual "connecting…" spinner.
function renderLanding() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <h1>multi-user template</h1>
    <p>A Max/MSP framework that turns phones into controllers — sensors, MIDI, sliders, mic, camera, multitouch — for collaborative pieces.</p>

    <div class="panel">
      <h2>Three ways in</h2>
      <p>Pieces are reachable via one of three URL types. The operator decides which to hand out depending on whether you're on the venue's wifi (LAN), joining over the internet (cloud relay), or watching as audience.</p>

      <h3 id="local" style="margin-top:14px;font-size:14px">1. Local (LAN)</h3>
      <p><code>http://&lt;laptop-lan-ip&gt;:8080/</code></p>
      <p>Same wifi as the laptop running Max. Lowest latency, no internet required. The patch shows this URL as <strong>Local URL</strong>.</p>

      <h3 id="performer" style="margin-top:14px;font-size:14px">2. Performer (cloud)</h3>
      <p><code>https://john.jann.one/multi-user-template/?cloud=…&piece=…&room=…</code></p>
      <p>Full Stage UI from anywhere with internet, via the Cloudflare Worker relay. Same sensor / MIDI / synth surface as LAN performers. The patch shows this URL as <strong>Performer URL</strong>.</p>

      <h3 id="audience" style="margin-top:14px;font-size:14px">3. Audience (cloud)</h3>
      <p><code>https://john.jann.one/multi-user-template/?cloud=…&piece=…&room=…&view=audience</code></p>
      <p>Stripped-down UI: live roster + reaction buttons + a small audience-input pad. The patch shows this URL as <strong>Audience URL</strong>.</p>

      <p style="margin-top:14px">If you don't have a link, ask the operator — they paste the right one out of the patch.</p>
    </div>

    <div class="panel">
      <h2>Run it yourself</h2>
      <p>Clone the repo, open the Max patch, <code>npm install</code> in the repo root and in <code>cloud/worker/</code>, deploy the Worker with <code>wrangler deploy</code>, paste the resulting <code>wss://…</code> URL into the patch's CLOUD RELAY section, press <strong>Cloud connect</strong>. The patch then generates the three share URLs (Local / Performer / Audience) on the fly.</p>
      <p class="row" style="margin-top:10px">
        <a class="ghost" style="padding:10px 14px;border-radius:10px;border:1px solid var(--line);text-decoration:none;color:var(--fg)" href="https://github.com/jjannone/multi-user-template">View source on GitHub</a>
        <a class="ghost" style="padding:10px 14px;border-radius:10px;border:1px solid var(--line);text-decoration:none;color:var(--fg)" href="/">← Back to projects</a>
      </p>
    </div>
  `;
  return wrap;
}

// ── audience UI ─────────────────────────────────────────────────

function renderAudienceJoin() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <h1>Audience</h1>
    <p>You're joining <code>${escHtml(config.piece)} / ${escHtml(config.room)}</code> as an audience member. Enter a name for the host to see (optional).</p>
    <div class="panel">
      <input id="aud-name" type="text" placeholder="Your name (optional)" autocomplete="off" autocapitalize="words" />
      <div style="height:10px"></div>
      <div class="row"><button id="aud-join" style="flex:1">Enter</button></div>
    </div>
  `;
  queueMicrotask(() => {
    const inp = wrap.querySelector("#aud-name");
    const btn = wrap.querySelector("#aud-join");
    inp.focus();
    const submit = () => {
      myName = (inp.value.trim() || `anon-${Math.floor(Math.random() * 1000)}`);
      // Send a "ping" so the host knows we're here; we don't have a
      // real "join" message in the audience whitelist.
      wsSend({ type: "ping", name: myName });
      render();
    };
    btn.onclick = submit;
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
  });
  return wrap;
}

function renderAudienceMain() {
  const wrap = document.createElement("div");
  const stateLabel = lastSnap && lastSnap.started ? "LIVE — performance in progress"
                                                  : "LOBBY — waiting for the piece to start";
  wrap.innerHTML = `
    <h1>${escHtml(config.piece)} / ${escHtml(config.room)}</h1>
    <p>${stateLabel}</p>

    <div class="panel">
      <h2>Performers (${lastSnap ? lastSnap.roster.length : 0})</h2>
      <div class="chips" data-roster></div>
    </div>

    <div class="panel">
      <h2>React</h2>
      <div class="row">
        <button id="r-1" style="flex:1;font-size:22px">👏</button>
        <button id="r-2" style="flex:1;font-size:22px">❤️</button>
        <button id="r-3" style="flex:1;font-size:22px">😮</button>
        <button id="r-4" style="flex:1;font-size:22px">🔥</button>
      </div>
    </div>

    <div class="panel">
      <h2>Audience pads</h2>
      <p>4 buttons + 1 slider stream to the host as <code>audience-input</code>. Use them however the piece wants.</p>
      <div class="pad-grid" id="aud-pads" style="grid-template-columns: repeat(4, 1fr)">
        ${Array.from({ length: 4 }, (_, i) => `<div class="pad" data-pad="${i}">${i}</div>`).join("")}
      </div>
      <div style="height:10px"></div>
      <div class="slider-row">
        <label>slider 0</label>
        <input type="range" min="0" max="1" step="0.001" value="0" data-slider="0" />
        <div class="v" data-slider-v="0">0.000</div>
      </div>
    </div>

    <div class="footer-note">audience inputs reach Max at <code>audience input ${escHtml(myName)} &lt;kind&gt; &lt;id&gt; &lt;value&gt;</code></div>
  `;
  queueMicrotask(() => {
    renderRosterInto(wrap.querySelector("[data-roster]"));
    wrap.querySelector("#r-1").onclick = () => sendAudienceReact("👏");
    wrap.querySelector("#r-2").onclick = () => sendAudienceReact("❤️");
    wrap.querySelector("#r-3").onclick = () => sendAudienceReact("😮");
    wrap.querySelector("#r-4").onclick = () => sendAudienceReact("🔥");
    bindPads(wrap.querySelector("#aud-pads"));
    const slider = wrap.querySelector("[data-slider]");
    slider.addEventListener("input", () => {
      const v = Number(slider.value);
      sendSensor("slider", { id: 0, value: v });
      const out = wrap.querySelector(`[data-slider-v="0"]`); if (out) out.textContent = v.toFixed(3);
    });
  });
  return wrap;
}

function escHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c])); }
function escAttr(s) { return escHtml(s).replace(/"/g, "&quot;"); }

window.addEventListener("hashchange", () => {
  // If we're on the stage, swap tab body in place to preserve other UI bits.
  if (lastSnap && lastSnap.started) render();
});

connect();
render();
