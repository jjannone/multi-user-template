# mu-relay — shared cloud relay (Cloudflare Worker)

A single Worker that fans WebSocket messages between a multi-user-template
host (Max patch) and any number of remote performers + audience members
over the public internet.

**Deployed once. Reused by every piece built on the multi-user template.**
Adding a new piece doesn't redeploy this Worker — it just picks a new
`<piece>` slug.

## URL shape

```
wss://<worker-host>/mu/<piece>/<room>/<role>

<piece>  slug for the performance / repo  e.g. immer-2026
<room>   slug for the venue / rehearsal   e.g. main, dress, tech
<role>   host | perform | audience
```

There is also a tiny `GET /` (or `/health`) HTTP endpoint that returns
service metadata — useful for sanity-checking a deploy without spinning
up a WS client.

## Roles

| role     | sent to host   | sent to perform | sent to audience | restrictions                                       |
|----------|----------------|-----------------|------------------|----------------------------------------------------|
| host     | —              | broadcast       | broadcast        | at most one per room — a new host kicks the old   |
| perform  | yes            | —               | —                | full message set (sensor streams, role changes…)  |
| audience | yes (limited)  | —               | —                | only `audience-input`, `audience-react`, `ping`   |

The relay enforces only role-based routing and the audience message
whitelist. Everything else (what counts as a valid role, what a sensor
looks like, how the piece is structured) is the host's decision.

## One-time deploy

```bash
cd cloud/worker
npm install
wrangler deploy
```

`wrangler login` should already be set up per the global notes. The
deployment uses the `account_id` baked into `wrangler.jsonc`.

After deploy you'll get a URL like:

```
https://mu-relay.<your-subdomain>.workers.dev
```

Copy the WebSocket form (replace `https` with `wss`) into the **Cloud
URL** field in `multi-user-template.maxpat` (or any derived patch).

## Using it from a derived repo

In a repo based on the multi-user template (e.g. `IMMER-2026`):

1. Open the patch.
2. Set **Piece** to a unique slug (e.g. `immer-2026`).
3. Set **Room** to whatever you want (default `main`).
4. Set **Cloud URL** to your relay's WS endpoint, e.g.
   `wss://mu-relay.<your-subdomain>.workers.dev`.
5. Press **Cloud connect**.

Now hand out two URLs:

| audience link        | `https://<your-static-host>/multi-user-template/?cloud=wss%3A%2F%2Fmu-relay.<sub>.workers.dev&piece=immer-2026&room=main&view=audience` |
|----------------------|---|
| remote performer link | `https://<your-static-host>/multi-user-template/?cloud=wss%3A%2F%2Fmu-relay.<sub>.workers.dev&piece=immer-2026&room=main`               |

(`<your-static-host>` = wherever you host `public/index.html` — for the
canonical setup that's `john.jann.one` via GitHub Pages.)

## Hibernation

The `MuRoom` Durable Object uses `state.acceptWebSocket()` so it hibernates
when idle. A room with no active connections costs nothing. When a
hibernated room wakes (first message after sleep), connection metadata
is restored from the `serializeAttachment` blob set at connect time.

## Limits to be aware of

- **One host per (piece, room).** A second `wss://.../host` connection
  closes the previous one. Same pattern as the LAN duplicate-name rule.
- **Messages from disconnected hosts are lost.** A `synthnote` from Max
  to a remote performer arrives only if both the host bridge and the
  remote performer are connected at that moment. The relay does not
  queue.
- **Audience whitelist is hard-coded.** Audience clients can only send
  `audience-input`, `audience-react`, `ping`. To extend, edit
  `AUDIENCE_TYPES` in `src/room.js`.
- **CORS is wide open on the health endpoint.** Tighten if you start
  exposing anything sensitive.
