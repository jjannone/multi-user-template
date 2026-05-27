// MuRoom — Durable Object for one (piece, room) pair.
//
// Uses the Cloudflare hibernation-aware WebSocket API
// (state.acceptWebSocket + webSocketMessage/Close handlers) so the room
// can sleep between events without dropping connections.
//
// Connection roles and routing:
//
//   host → perform + audience          snapshot, stage, cmd (broadcast)
//   host → ONE perform                 cmd (directed by `to: <name>`)
//   perform → host                     join, leave, roles, sensor, …
//   audience → host                    {type:"audience-input", kind, …}
//                                      audience can only send this type
//   perform → perform                  NEVER
//   audience → audience                NEVER
//   audience → perform                 NEVER
//
// The DO is intentionally dumb: it doesn't know what a "role" or "sensor"
// is; it just routes by message type and `to` field. Semantics live in
// the host (Max patch + server.js). That keeps the relay generic enough
// to support every piece built on the template without redeploys.

const ROLE_HOST     = "host";
const ROLE_PERFORM  = "perform";
const ROLE_AUDIENCE = "audience";

// Messages that audience members are allowed to send to the host.
// Anything else is dropped. This is the only piece-agnostic policy we
// enforce in the relay itself.
const AUDIENCE_TYPES = new Set(["audience-input", "audience-react", "ping"]);

export class MuRoom {
  constructor(state, env) {
    this.state = state;
    this.env   = env;
    // In-memory tag map: ws → { role, name, joinedAt }. Hibernation
    // serializes this via setSerializeAttachment; we mirror it in JS for
    // hot-path lookups.
    this.meta = new WeakMap();
  }

  // ── HTTP entry ───────────────────────────────────────────────

  async fetch(request) {
    const role  = request.headers.get("x-mu-role")  || "perform";
    const piece = request.headers.get("x-mu-piece") || "";
    const room  = request.headers.get("x-mu-room")  || "";

    const pair   = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    // Use hibernation-aware accept. Attachment is durable across
    // hibernation cycles — we stash role + name there.
    this.state.acceptWebSocket(server);
    const attachment = { role, name: null, piece, room, joinedAt: Date.now() };
    server.serializeAttachment(attachment);
    this.meta.set(server, attachment);

    // Enforce the host singleton: a new host kicks the old. Performers /
    // audience are unbounded.
    if (role === ROLE_HOST) {
      const others = this.state.getWebSockets();
      for (const ws of others) {
        if (ws === server) continue;
        const m = this._meta(ws);
        if (m && m.role === ROLE_HOST) {
          try { ws.close(1000, "replaced by new host"); } catch (_) {}
        }
      }
    }

    // Send a hello so the new client knows the room is alive even before
    // the host posts its first snapshot.
    try {
      server.send(JSON.stringify({
        type:        "mu-hello",
        role,
        piece,
        room,
        connections: this._countByRole()
      }));
    } catch (_) {}

    // Tell the host (if any) that someone joined — useful for piece
    // analytics and for sending a personalized snapshot.
    if (role !== ROLE_HOST) this._toHost({ type: "mu-presence", event: "join", role });

    return new Response(null, { status: 101, webSocket: client });
  }

  // ── hibernation handlers ─────────────────────────────────────

  async webSocketMessage(ws, raw) {
    const me = this._meta(ws);
    if (!me) return;
    let msg;
    try { msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw)); }
    catch (_) { return; }

    // Re-attach updated `name` whenever the host or a performer reports it.
    if (msg && typeof msg.name === "string" && msg.name.trim()) {
      me.name = msg.name.trim();
      try { ws.serializeAttachment(me); } catch (_) {}
    }

    if (me.role === ROLE_HOST) {
      this._fromHost(ws, msg);
    } else if (me.role === ROLE_PERFORM) {
      // Performers send anything the LAN client would send. Pass through
      // to the host, which decides what to do.
      this._toHost(Object.assign({ from: me.name || null, fromRole: "perform" }, msg));
    } else if (me.role === ROLE_AUDIENCE) {
      // Audience is restricted to a small set of message types. Anything
      // else is dropped silently — keeps the audience tier from
      // accidentally flooding the host with sensor streams.
      const t = msg && msg.type;
      if (!t || !AUDIENCE_TYPES.has(t)) return;
      this._toHost(Object.assign({ from: me.name || null, fromRole: "audience" }, msg));
    }
  }

  async webSocketClose(ws /*, code, reason, wasClean*/) {
    const me = this._meta(ws);
    if (!me) return;
    if (me.role !== ROLE_HOST) {
      this._toHost({ type: "mu-presence", event: "leave", role: me.role, name: me.name || null });
    }
    this.meta.delete(ws);
  }

  async webSocketError(ws /*, error*/) {
    // Same cleanup as close — Cloudflare delivers both for errors.
    this.meta.delete(ws);
  }

  // ── routing helpers ──────────────────────────────────────────

  _meta(ws) {
    let m = this.meta.get(ws);
    if (m) return m;
    // After hibernation our WeakMap is empty; rehydrate from attachment.
    try {
      const a = ws.deserializeAttachment();
      if (a) { this.meta.set(ws, a); return a; }
    } catch (_) {}
    return null;
  }

  _countByRole() {
    const out = { host: 0, perform: 0, audience: 0 };
    for (const ws of this.state.getWebSockets()) {
      const m = this._meta(ws);
      if (m && out[m.role] != null) out[m.role]++;
    }
    return out;
  }

  // Host outgoing message → fan out to performers / audience.
  //
  // Conventions:
  //   {type:"snapshot", ...}           → broadcast to perform + audience
  //   {type:"stage", ...}              → broadcast to perform + audience
  //   {type:"cmd", cmd:..., to:"name"} → directed to that perform/audience
  //   {type:"cmd", cmd:..., to:null}   → broadcast cmd to all perform+audience
  //   {type:"cmd", cmd:..., toRole:"perform"|"audience"} → restrict scope
  //   anything else                    → broadcast to perform + audience
  //                                      (host can use this to ship
  //                                      piece-specific messages)
  _fromHost(senderWs, msg) {
    const t = msg && msg.type;
    const directed = msg && (typeof msg.to === "string") && msg.to;
    const scope    = msg && msg.toRole;

    // mu-presence-reply: host telling the relay to push a personalized
    // snapshot to one fresh joiner. We just deliver it.
    if (directed) {
      for (const ws of this.state.getWebSockets()) {
        const m = this._meta(ws);
        if (!m || m.role === ROLE_HOST) continue;
        if (m.name === msg.to) this._safeSend(ws, msg);
      }
      return;
    }

    // Scoped broadcast: only to performers, or only to audience.
    if (scope === ROLE_PERFORM || scope === ROLE_AUDIENCE) {
      for (const ws of this.state.getWebSockets()) {
        const m = this._meta(ws);
        if (!m || m.role !== scope) continue;
        this._safeSend(ws, msg);
      }
      return;
    }

    // Default: broadcast to everyone except the host that sent it.
    for (const ws of this.state.getWebSockets()) {
      if (ws === senderWs) continue;
      const m = this._meta(ws);
      if (!m || m.role === ROLE_HOST) continue;
      this._safeSend(ws, msg);
    }
  }

  // Performer / audience outgoing message → forward to the host. If no
  // host is connected, queue nothing; the message is lost. (A piece that
  // needs at-least-once delivery should layer it on top — same rule as
  // Max → phone commands on the LAN side.)
  _toHost(msg) {
    for (const ws of this.state.getWebSockets()) {
      const m = this._meta(ws);
      if (!m || m.role !== ROLE_HOST) continue;
      this._safeSend(ws, msg);
      return; // singleton host
    }
  }

  _safeSend(ws, obj) {
    try { ws.send(JSON.stringify(obj)); } catch (_) {}
  }
}
