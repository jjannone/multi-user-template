// multi-user-template — shared cloud relay (Cloudflare Worker)
//
// Generic WebSocket fan-out for any piece built on the multi-user template.
// Deploy this Worker once; every derived repo points at it by piece-id.
//
// URL shape:
//   wss://<worker-host>/mu/<piece>/<room>/<role>
//
//   <piece>  — slug identifying the performance / repo (e.g. "immer-2026")
//   <room>   — slug identifying a specific room or rehearsal (e.g. "main", "tech")
//   <role>   — host | perform | audience
//
// Roles:
//   host       — the Max patch's bridge connection. At most one per
//                (piece, room). Authoritative source of roster + transport.
//                A new host kicks the old one (same pattern as the LAN
//                duplicate-name rule).
//   perform    — a remote performer. Full sensor / control access, same
//                client-side code as a LAN performer.
//   audience   — an audience member. Receives roster + stage snapshots;
//                can send only "audience-input" events (a constrained
//                control surface).
//
// One Durable Object instance per (piece, room) routes messages between
// the three roles. The DO is keyed by `<piece>:<room>` so the same room
// in different pieces are isolated.

export { MuRoom } from "./room.js";

const URL_RE = /^\/mu\/([A-Za-z0-9_\-]+)\/([A-Za-z0-9_\-]+)\/(host|perform|audience)\/?$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Tiny health endpoint so a deploy can be sanity-checked without
    // spinning up a WebSocket client.
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(JSON.stringify({
        ok: true,
        service: "multi-user-template cloud relay",
        url_shape: "/mu/<piece>/<room>/<host|perform|audience>",
        ts: Date.now()
      }), { headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });
    }

    const m = url.pathname.match(URL_RE);
    if (!m) {
      return new Response("not found — expected /mu/<piece>/<room>/<host|perform|audience>", { status: 404 });
    }
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket upgrade", { status: 426 });
    }

    const [, piece, room, role] = m;
    const id   = env.ROOMS.idFromName(`${piece}:${room}`);
    const stub = env.ROOMS.get(id);

    // Forward the request to the DO, passing the role + identifiers via
    // headers (the DO reuses these on accept). Path is already enough but
    // headers are cheap and explicit.
    const req = new Request(request);
    req.headers.set("x-mu-role",  role);
    req.headers.set("x-mu-piece", piece);
    req.headers.set("x-mu-room",  room);
    return stub.fetch(req);
  }
};
