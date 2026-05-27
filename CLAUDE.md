# Working notes for Claude (and future contributors)

This file is the canonical home for project-specific lessons. If you
discover a non-obvious gotcha while working in this repo — a Max attribute
that silent-fails, a Node-for-Max quirk, a sensor-API trap on iOS — **write
it here**. Memory in `~/.claude/` is private to one machine and invisible
to anyone who clones the repo; knowledge written here travels with the code.

---

## Inherited from IMMER

These patterns came from `../IMMER/CLAUDE.md` and are load-bearing here too.
Don't undo them without reading the original:

* **Disconnect ≠ leave.** `ws.on("close")` from a phone screen-lock / wifi
  blip must NOT call `removePerformer` — that wipes the user's identity,
  role choices, and (here) admin auth. Use `disconnectPerformer`, which
  keeps the record and only sets `connected = false`. Explicit
  `{type:"leave"}` from the client (or the patch's `clear` command) is the
  only signal that wipes the record.
* **Heartbeat required.** `ws.on("close")` only fires for clean closes;
  airplane mode leaves the socket "open" forever. The 15s ping/pong sweep
  catches phantoms within 2× the interval. `terminate()` then triggers
  `close`, which routes through `disconnectPerformer`.
* **Duplicate-name join: overwrite `sockets[name]` BEFORE closing the old
  socket.** If you close first, the old socket's close handler finds itself
  still in `sockets`, calls `disconnectPerformer`, and torpedoes the new
  device's brand-new connection. (See IMMER CLAUDE.md for the full trace.)
* **Mid-piece config mutations must act or refuse — never silently ignore.**
  `setport` refuses if the piece is running (an HTTP restart would drop all
  clients). `setpassword` accepts at any time but does NOT strip existing
  admins — rotation locks out future joiners, not current ones.
* **Restart-friendly server lifecycle.** Fresh `http.createServer()` and
  `new WSServer(...)` per `startServer()` call. `.listen()` after `.close()`
  is unreliable across Node versions; the OSC `UDPPort` is recreated
  similarly so port changes apply cleanly.
* **Broadcast to `wss.clients`, not just `performers`.** Unjoined lobby
  viewers — phones that opened the page but haven't typed a name yet —
  must still receive roster updates, otherwise different phones will see
  different "Already joined" lists depending on when they opened the page.
* **No `localStorage` on the client.** A hard refresh is the canonical
  "reset me" gesture; `myName` lives only in script memory so reconnects
  within the same page session auto-rejoin, but a tab close clears state.
* **Strong no-cache headers.** iOS Safari is otherwise gleeful about
  handing back a previous version of `index.html` or a stale JS bundle from
  disk, and different phones end up running materially different lobby
  code at the same time.

## New patterns specific to this template

### Admin auth survives disconnect; admin enable does NOT survive `setpassword`

A performer who has authenticated as admin keeps `isAdmin = true` across
socket drops, role re-toggles, and even password changes from the patch.
The reasoning:

* **Drops**: same as the Anna rule — a screen lock during a piece must not
  silently demote the only admin in the room.
* **Password rotation**: the patch operator might rotate the password mid-
  piece because someone overheard it. Stripping current admins on rotation
  would be a footgun — the conductor would have to immediately re-share the
  new password with the same people. Rotation locks *future* joiners out;
  it does not boot the current ones.

If you ever need "kick the admin," use `clear` (kicks everyone) or extend
the patch with a `revokeadmin <name>` handler.

### Sensor stream gating: lobby clients can't push sensor data

`handleSensor` returns immediately if `!started` or if the sender has no
role. Otherwise an idle phone in the lobby with motion enabled would fire
~16 Hz of data at Max before the piece has begun. The client's UI also
hides the sensor cards while in the lobby, but the server's check is the
authoritative one — a stale tab from a previous piece could be sending
events without our knowledge.

### OSC name sanitization

OSC addresses have a restricted character set (no spaces, `/`, `*`, `?`,
`[`, `]`, `{`, `}`, `#`, `,` in the path components). Performer names go
straight into `/user/<name>/...`, so `oscSafe()` replaces anything outside
`[A-Za-z0-9_-]` with `_`. The display roster preserves the original name —
only the OSC address is sanitized. If two performers' names collide after
sanitization (`Anna B` and `Anna_B`), they'll share an OSC namespace; the
patch sees both names in `roster` so the conductor can spot the conflict.

### Send rates and back-pressure

DeviceMotion / DeviceOrientation events fire ~60 Hz on modern phones. We
throttle to ~16 Hz per stream client-side (`intervalMs: 60`) to keep the
WS busy enough to feel responsive but not so busy that the server can't
fan out OSC packets. Mic level is RAF-driven and throttled to 20 Hz.
Touch is event-driven (no throttle — touches don't usually fire that fast).

If you push these rates higher, watch for:

* **OSC packet loss** on busy wifi (`osc` lib uses unreliable UDP — that's
  the whole point of OSC, but it does mean dropped samples).
* **WebSocket back-pressure**: the `ws` package buffers writes. If a slow
  phone can't keep up, that buffer grows. Currently we don't check
  `ws.bufferedAmount` before sending; if you start streaming camera frames
  through this socket, add the check.

### `node.script @watch 1` watches the file, not the dependencies

Saving `server.js` reloads the server. Editing `public/index.html` does
NOT reload anything — the HTML is served fresh on every request (no-cache
headers) so the next phone refresh picks it up. But the *Node* side keeps
running. If you change a server-side handler, save `server.js` to reload.
If you change client code, refresh the phone.

### OSC parsing inside Max

The patch uses Max's built-in `[oscparse]` (Max 8+). If you're on an older
Max or want to use CNMAT's odot package instead, replace
`[udpreceive 7400] → [oscparse]` with `[o.udpreceive 7400]`. The
downstream `[route /user]` works either way because both produce native
Max messages with the OSC address as the leading symbol.

### Roles textedit splits on whitespace, not commas

`setroles` accepts a variadic argument list; the `[textedit]` object in
Max breaks its content on whitespace by default, so `role1 role2 role3`
becomes three separate symbols. If you need a role name with a space
(`"slow movement"`), you have to encode it (`slow_movement`) — there's
no quoting layer here.

---

## Patching lessons (general)

### Hide formatter boxes (and their cables) downstream of UI elements

Same rule as IMMER: if a box exists *solely* to format a value coming from
an upstream UI element — a `[setport $1]` between a number box and
`node.script`, a `[start]` between a button and `node.script` — set
`"hidden": 1` on the box and on every cable touching it. The locked-view
patch shows only user-facing controls; plumbing is for editors. This patch
hides every `setport`, `setoscport`, `setpassword`, `setroles`, `start`,
`stop`, `clear` message box and their lines into `node.script`.

### Don't conclude a Max attribute "doesn't exist" from a truncated grep

When verifying whether an attribute or message exists on a Max object,
**read the whole refpage section, not a truncated `head`**. A wrong-name
that's silently accepted is the same class of failure as one written from
memory. See IMMER's CLAUDE.md for the `@popup` story.

---

### Feature-detect before calling — every "new" web API has gaps

The Stage tabs cover a wide cross-section of browser APIs, and many of
them are partially implemented or quietly missing:

| API                          | iOS Safari   | Android Chrome | Notes |
|------------------------------|--------------|----------------|-------|
| DeviceMotion / Orientation   | ✅ (perm)    | ✅              | iOS needs explicit `requestPermission()` from a user gesture |
| Geolocation (high-accuracy)  | ✅ (perm)    | ✅              | Requires HTTPS or localhost |
| getUserMedia (mic/cam)       | ✅           | ✅              | HTTPS or localhost; user gesture |
| SpeechRecognition            | ✅ (limited) | ✅              | Vendor-prefixed on iOS. Long sessions auto-end; we restart in `onend`. |
| SpeechSynthesis              | ✅           | ✅              | Voices vary; we don't pick one |
| Vibration                    | ❌           | ✅              | iOS Safari does not vibrate |
| Battery API                  | ❌           | ✅              | macOS Safari recently dropped it too |
| Network Information          | ❌           | ✅              | iOS doesn't expose Connection |
| Generic Sensor (Gravity, LinearAccel, Magnetometer, Pressure) | ❌ | ✅ | Chromium-only |
| AmbientLight                 | ❌           | ✅ (Android only) | rare; behind a flag on some builds |
| ProximitySensor              | ❌           | rarely         | spec was effectively removed |
| Web Bluetooth                | ❌           | ✅              | iOS Safari does NOT support |
| Web NFC                      | ❌           | ✅              | Android Chrome only |
| Web MIDI                     | ❌           | ✅              | iOS Safari has no Web MIDI; the MIDI tab here only emits via WS, not Web MIDI |
| Gamepad                      | ✅           | ✅              | Requires a connected pad and a user gesture to start |
| Fullscreen                   | partial      | ✅              | iOS reserves fullscreen for video elements |

**Rule:** every API call inside a tab module is wrapped in a try/catch (or
preceded by a `typeof X === "function"` check) that surfaces "denied: …"
or "no X (browser only)" into the tab's readout. **Never let a missing API
silently no-op** — the performer will assume the page is broken.

### Stage tabs share state via the `sensors` object — don't shadow it

Every tab module reads from and writes into the global `sensors` map in
`app.js`. The map holds `on` flags and per-sensor handles (watch ids,
audio contexts, event listeners) so a tab can be re-rendered freely
without losing what was running. Don't introduce a local `s = {…}` inside
a render function and store handles in it — the next re-render will
orphan whatever was in flight, the toggle pill will desync from reality,
and stop functions will fail to clean up.

### Multi-touch state lives outside the touchpad DOM

`touchState.active` is global (not bound to the touchpad element). Same
reason — a stage re-render rebuilds the pad's DOM, but the user's fingers
are still down. Without a global state map, we'd send a stale "0 fingers"
on every re-render. The pad rebinds events on render but reads/writes
through `touchState`.

### Tab id lives in `location.hash`, not localStorage

Same rule as the rest of the client — no persistent storage. The hash
survives a soft refresh (same tab on reconnect) but is wiped by a hard
close-and-reopen, which is the expected "reset me" gesture.

### `synthnote 0 0` is NOT a no-op — it's a note-off for note 0

The Output-tab synth engine treats `vel === 0` as note-off (matching MIDI
semantics). If you send `synthnote 60 0` thinking you're silencing a
specific note, that's exactly what happens — but be aware that the
template is monophonic so any subsequent note-off message releases
whatever voice is active, regardless of which note number it carries. If
you want polyphony, fan out across phones (one note per device) — the
template intentionally doesn't do voice-stealing inside one browser tab.

### `ensureAudio()` must be called from a user gesture before Max can drive the synth

iOS Safari (and recent Chrome) refuse to start an `AudioContext` unless
the call comes from a `click`/`touchstart` handler. The Output tab has a
big "Tap to enable audio" button for this reason. If a performer never
taps it, all the `synthnote` / `beep` / `synthset` commands Max sends will
be received and logged but produce no sound. The patch operator can't
work around this — it's a hard browser rule.

### Max → phone commands silently drop for disconnected performers

`sendCmdToName` looks up the WebSocket in `sockets` and gives up if it's
not there. A vibrate sent to a phone with a locked screen doesn't queue
up; it's gone. This is deliberate — re-firing a stale "vibrate 500" on
rejoin would be a confusing surprise three minutes later. If you need a
guaranteed-delivery semantic, layer it on top (e.g., a "current state"
broadcast on join).

### Cloud bridge: same room, two transports, one unified roster

The LAN HTTP+WS server in `server.js` continues to be authoritative.
The cloud bridge (an outbound `ws` client to `cloud/worker`) is OPTIONAL
and runs **in addition to**, not instead of, the LAN server. Both must
be able to operate alone — a power outage at the venue should not
disconnect LAN phones, and a wifi outage at the venue should not
disconnect remote performers.

Performers are tracked in one `performers` map regardless of transport:

* `p.kind === "lan"`    → there's a real `sockets[name]` WebSocket
* `p.kind === "remote"` → no LAN socket; messages route via `cloudWs`
                          with `{ to: <name> }` and the relay delivers
                          them to that performer's connection

`sendCmdToName(name, cmd)` dispatches by `p.kind` so callers (every
`Max.addHandler` for vibrate/speak/synth/etc.) don't have to know which
transport the performer is on.

Sensor data from cloud performers is delivered into the same
`handleSensor(name, msg)` path as LAN performers, so the Max outlets and
OSC fan-out treat them identically. There is exactly one shared
`Max.outlet("sensor", name, kind, …)` for both populations.

### `handleSensor` takes a name, not a socket

A refactor over the original IMMER pattern: the function looks up the
performer by `name`, not by `nameForSocket(ws)`. The reason: cloud-relayed
performers don't have a real LAN ws, so a ws-lookup-only function can't
serve both paths. Both call sites resolve the name first, then dispatch.
**Don't put ws-only logic back into `handleSensor`** — keep it
transport-agnostic.

### Snapshots fan out to LAN + cloud, with cloud personalized per remote

`broadcastSnapshot` does two things:

1. Iterates `wss.clients` and sends each LAN client a personalized
   snapshot (same as IMMER — including unjoined lobby viewers).
2. If `cloudReady`, sends each REMOTE performer a personalized snapshot
   (directed by `{ to: name }`), plus one non-personalized snapshot
   scoped to audience (`{ toRole: "audience" }`).

The relay handles fan-out from there. Don't try to do per-audience
personalization — we don't track audience identities; the audience
client looks itself up in the roster from the broadcast snapshot.

### Host-singleton in the Durable Object — same idea as duplicate-name

When a `wss://.../host` connection opens, the DO closes any existing
host. This mirrors the LAN duplicate-name rule: a new connection wins,
the old one is reaped. If the patch's `cloudon` is pressed while a stale
host is still attached from a previous run, the relay does the right
thing. Don't try to "queue" a second host — accept and replace.

### Audience whitelist is enforced in the relay, not the host

`AUDIENCE_TYPES` in `cloud/worker/src/room.js` is the only piece-agnostic
policy the relay enforces. Audience clients sending anything else are
silently ignored. This protects the host from a misbehaving (or
malicious) audience client firehosing sensor streams. If you extend the
audience capabilities, extend `AUDIENCE_TYPES` AND the
`handleAudienceInbound` switch in `server.js`.

### Cloud disconnection is auto-retried; user-requested disconnect is not

`cloudDisconnect()` sets `cloudClosing = true` so the WS close handler
knows not to schedule a reconnect. Any other path that drops the socket
(network blip, relay restart, the relay kicking us due to a new host)
schedules a 3-second reconnect. Watch for: a new host elsewhere will
keep kicking you in a loop if you don't notice. The patch surfaces
"replaced by new host" in the cloud-status comment so the operator can
see it.

### Static client URL conventions for derived repos

A derived repo (e.g. `IMMER-2026`) typically hosts its `public/` on
GitHub Pages at `<user>.github.io/<repo>/`. The standard URL shape for
that piece becomes:

```
LAN:      http://<lan-ip>:8080/
Remote:   https://<user>.github.io/<repo>/?cloud=<encoded-wss>&piece=<repo-slug>&room=main
Audience: https://<user>.github.io/<repo>/?cloud=<encoded-wss>&piece=<repo-slug>&room=main&view=audience
```

Keep `<piece>` consistent between the patch and the URLs — there is no
discovery mechanism; if they don't match, performers join different DOs
and never see each other.

### Monitor cellblock — coalesce repaints, never tick per-event

Every sensor update calls `recordSensor(name, kind, summary)` which writes
into `performers[name].lastSensors[kind]` and schedules `pushMonitor()`
through `schedMonitor()`. The scheduler debounces to ~4 Hz — without it,
a 16 Hz motion stream from ten performers would fire 160 cell-rewrites
per second at Max, which is visible flicker (cellblock repaint isn't
free) and burns CPU for no benefit. **Add a `recordSensor` call inside
every new sensor case AND a matching column** in `MONITOR_COLS` — if you
add one without the other, the column exists but never updates.

The cellblock itself is `selmode: 0` (display-only), matching the
Claude2Max rule: never reset selmode silently when the operator might
have configured it. Resize via the `rows N` / `cols N` / `clear`
prefix before the per-cell `set` calls so the grid matches the current
performer count exactly.

### Presentation view is the operator's surface; patching view is for editing

The patch opens in presentation (`openinpresentation: 1`) and the
presentation is laid out for a running performance: server status row,
transport, cloud connect controls, the monitor cellblock. Output
preset message boxes stay in the patching view — they're test
affordances, not performance controls.

Derived repos inheriting the template should preserve this split: keep
adding presentation positions for any new UI control you introduce
(per the Claude2Max binding rule), and leave routers / formatters /
print objects out of the presentation entirely.

## Possible future work

* **Internet relay via Cloudflare Workers + Durable Objects.** Port
  `server.js` into the `jannone-api` Worker; one Durable Object per room.
  Static client moves to `john.jann.one/multi-user-template/`. Max gets a
  thin Node-for-Max bridge that connects to the Worker as a WS client and
  re-emits the same outlets + OSC locally. The current LAN code becomes a
  fallback for shows without internet.
* **Supabase Realtime variant.** Same idea, but each phone is a Realtime
  channel subscriber, and every event hits Postgres for free history.
  Replace the in-patch admin password with GitHub OAuth.
* **Capacitor wrapper** for direct UDP-from-phone OSC. Single codebase,
  feature-detected fallback to WS when running in plain Safari.
* **Camera frames over WS** — adding periodic JPEG sampling
  (`canvas.toDataURL` → base64 over WS) gives Max access to phone video
  without a full WebRTC stack. Watch `ws.bufferedAmount` if you do this.
* **Per-role permission**: right now any joined performer (with any role
  set) can send any sensor or control input. If a piece wants
  "only role1 can send motion," add a role→sensors permission table in
  `handleSensor`.
* **Polyphony in the Output synth.** The current voice manager is mono.
  A simple `voices` map keyed by note number, with up to N concurrent
  oscillators, would make the on-phone synth a real instrument.
* **Sample preset library.** `synthset sampleUrl https://…` works today
  but doesn't preload. A short list of known-good samples in
  `/public/samples/` plus a `synthloadsample <name>` command would make
  the sample mode useful out of the box.
