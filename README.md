# multi-user-template

A Max patch that turns every phone in the room into a controller. Performers
open a URL, enter their name, see who else has joined, pick one or more
roles (with an admin password gating the `admin` role), and wait in a lobby
until an admin starts the piece. Once the piece starts, the page exposes
every sensor the browser will give us — motion, gyroscope, orientation,
compass heading, geolocation, microphone level, camera preview, multi-touch
pad, battery, network, ambient light — and streams them back to Max over
both WebSocket and OSC/UDP.

Based on [IMMER](../IMMER/), with the role-specific logic stripped out so
this can act as a starting point for any multi-user Max piece.

## What each phone sees

1. **Join** — type a name and pick one or more role tiles in the same screen.
   Toggle `admin` to reveal a password field. See who's already in the lobby.
   Press **Join lobby** to commit name + roles in one shot.
2. **Lobby** — confirmation of your roles, the live roster, and (if you
   authenticated as admin) a **START PIECE** button. *Change roles* sends you
   back to the join screen with your name and selection preserved.
3. **Stage** (once an admin presses START) — a grid of sensor cards. Tap each
   card's `OFF`/`ON` pill to start that stream. The Max patch receives data
   immediately.

## Architecture

```
   ┌──────────────────────┐                  ┌────────────────────┐
   │  multi-user-         │ messages ↔ JS    │  server.js         │
   │  template.maxpat     │ ←──────────────→ │  node.script       │
   │  • config + admin pw │   max-api        │  • HTTP server     │
   │  • transport         │                  │  • WS server       │
   │  • OSC receive       │ ←─── OSC/UDP ─── │  • OSC fan-out     │
   │  • status displays   │                  │                    │
   └──────────────────────┘                  └─────────┬──────────┘
                                                       │  http/ws
                                             ┌─────────▼──────────┐
                                             │  performers' phones│
                                             │  public/index.html │
                                             └────────────────────┘
```

Server messages are routed by leading selector in the patch:
`performer`, `roster`, `status`, `url`, `started`, `admincount`, `sensor`.

Sensor data also fans out as OSC over UDP. Default address scheme:

```
# motion
/user/<name>/motion       ax ay az            (m/s², ~16 Hz)
/user/<name>/gyro         rx ry rz            (deg/s)
/user/<name>/orient       alpha beta gamma    (deg)
/user/<name>/heading      deg                 (0–360, clockwise from north)
/user/<name>/gravity      gx gy gz            (Generic Sensor, Android)
/user/<name>/linaccel     ax ay az            (Generic Sensor, Android)
/user/<name>/magnet       mx my mz            (µT, Android)

# location
/user/<name>/geo          lat lon alt acc

# audio
/user/<name>/mic          rms peak            (0..1, ~20 Hz)
/user/<name>/speech       text final          (interim and final transcripts)

# touch / pointer / control
/user/<name>/touch/count  n
/user/<name>/touch/<i>    x y force           (x/y normalized 0..1)
/user/<name>/pointer      x y pressure tiltX tiltY type
/user/<name>/button/<id>  0|1
/user/<name>/slider/<id>  value (0..1)
/user/<name>/dial/<id>    value (0..1)
/user/<name>/key          char code
/user/<name>/text         full-text
/user/<name>/midi/noteon  note vel chan
/user/<name>/midi/noteoff note vel chan
/user/<name>/midi/cc      cc value chan
/user/<name>/gamepad/axis/<i>    value
/user/<name>/gamepad/button/<i>  value

# system
/user/<name>/battery   level charging   (0..1, 0|1)
/user/<name>/net       type downlink    (string, Mbps)
/user/<name>/light     lux              (Android only)
/user/<name>/pressure  hPa              (Android only)
/user/<name>/proximity dist max         (Android only, rare)
/user/<name>/screen    orientation visible fullscreen
```

`<name>` is sanitized — anything outside `[A-Za-z0-9_-]` is replaced with `_`.

### Max → phone (commands sent over WebSocket)

Send any of these as a message to `node.script` (the patch has preset
message boxes wired up in the **OUTPUT TO PHONES** section):

```
vibrate <ms>              every connected phone buzzes for <ms>
vibrateto <name> <ms>     one performer only
speak <text...>           every phone speaks via Web Speech Synthesis
speakto <name> <text...>
beep <freq> <ms>          short oscillator tone
beepto <name> <freq> <ms>
display <text...>         show text on each phone's Output tab
displayto <name> <text...>

# Synth (on the phone's Output tab):
synthmode osc|fm|wavetable|sample
synthmodeto <name> <mode>
synthnote <note> <vel>       vel=0 ⇒ note-off
synthnoteto <name> <note> <vel>
synthset <param> <value>     params: attack release cutoff q modIndex
                                       modRatio waveform sampleUrl
synthsetto <name> <param> <value>
```

### Stage tabs (what each phone shows)

| tab        | inputs                                                                  |
|------------|-------------------------------------------------------------------------|
| Motion     | acceleration, gyroscope, gravity, linear accel, magnetometer            |
| Orient     | orientation (α/β/γ), compass heading                                    |
| Location   | geolocation (high-accuracy)                                             |
| Audio      | mic level + waveform, speech-to-text                                    |
| Camera     | live preview (frames stay on-device by default)                         |
| Touch      | multi-touch pad (up to 16 fingers)                                      |
| Pointer    | pen/stylus/mouse with pressure + tilt                                   |
| Buttons    | 16-pad grid                                                             |
| Sliders    | 4 sliders + 4 dials                                                     |
| Keyboard   | text input — emits per-keystroke and full-text                          |
| MIDI       | 2-octave piano with octave shift and channel selector                   |
| Gamepad    | first connected gamepad's axes + buttons                                |
| System     | battery, network, ambient light, screen state, barometer, proximity     |
| Wireless   | Web Bluetooth scan, Web NFC tag read (Android Chrome)                   |
| Output     | display message, synth engine, command log (Max → phone)                |

Tab is persisted in `location.hash` so a phone refresh returns to the same tab.

## First-time setup

1. Install **Max 9** (with the bundled Node for Max package).
2. From a terminal inside this folder:
   ```bash
   npm install
   ```
3. Open `multi-user-template.maxpat` in Max. The server auto-starts.

## Running it

1. The **URL** field shows `http://<your-lan-ip>:8080/` once the server is
   listening. Performers open it on any phone/laptop on the same wifi.
2. Set the **Admin password**. Empty = admin role disabled.
3. Optional: change the **Roles** textedit (space-separated). Default is
   `role1 role2 role3`. The literal name `admin` is reserved.
4. Performers join, pick roles, an admin presses **START** (either on the
   patch or from any authenticated admin's phone).
5. The stage screen appears on every phone. Performers toggle whichever
   sensors they want to send.
6. **STOP** returns everyone to the lobby. **CLEAR** kicks everyone.

Wiring an OSC receiver:

* The patch already has `[udpreceive 7400] → [oscparse] → [route /user] →
  [print OSC]`. Replace the print with `[route <username>]` per performer
  (or use a `[zl group]` / `[coll]` to demux by name), then route by sensor
  kind: `[route motion gyro orient touch geo mic battery net heading light]`.

## Q&A — the exploration questions

These are the open questions the project was scoped against. Short answers
here; longer notes in `CLAUDE.md`.

### Internet connection via `john.jann.one`

Given the stack already wired up in the global `CLAUDE.md`
(GitHub Pages + Cloudflare Workers + D1 + Supabase), the cleanest path is:

| pattern                                | how                                                                                                                                                                                 | trade-off                                                                                            |
|----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| **CF Workers + Durable Objects (rec.)** | Port `server.js` into the `jannone-api` Worker — one Durable Object per room holds roster + transport. Static client at `john.jann.one/multi-user-template/` opens `wss://jannone-api.workers.dev/mut/<roomId>`. Max becomes a WS *client* of the Worker (a small Node-for-Max script connects out and re-emits the same `Max.outlet` selectors + OSC to `localhost:7400`). | Stable HTTPS URL, no laptop port-forwarding, free tier handles it. ~40–80 ms extra latency. Requires a code split between the Max-side bridge and the Worker. |
| **Supabase Realtime**                  | Each phone is a Realtime channel subscriber; Max connects via `@supabase/supabase-js`. Auth, persistence, RLS all come for free. Pre-register performers with GitHub OAuth or magic links. | Similar latency. Postgres-backed history is a real bonus. Slightly more setup than a Worker.        |
| **Cloudflare Tunnel** (lowest effort)  | `cloudflared tunnel --url http://localhost:8080` gives a stable `*.trycloudflare.com` URL. No code change — performers visit the tunnel URL instead of your LAN IP.                  | One-off / quick. Tunnel URL changes per session unless you use a named tunnel.                       |

**Other capabilities this stack unlocks (beyond just internet access):**

1. **Persistent piece history** — Supabase logs every join / role-change / sensor event; replay or analyze later.
2. **Pre-registration + casting** — Performers sign up via Supabase auth before a show; admin assigns roles in a web admin panel.
3. **Cross-venue pieces** — Two rooms in different cities both attach to the same Durable Object. Movement in one drives sound in the other.
4. **Audience participation tier** — Audience joins as a viewer/voter role over the internet during a live LAN show.
5. **Asset hosting in Supabase Storage** — Patches, samples, scores, configurations live there; Max pulls them at boot. Versioning for free.
6. **Auth-gated admin** — Replace the in-patch password with real OAuth; only allowlisted GitHub users can be admin.
7. **Edge OSC bridge** — A tiny Node program on your laptop subscribes to the Worker / Supabase channel and re-emits OSC to `[udpreceive]`. Same outcome as today's Node-for-Max, decoupled from the patch.

CF/Supabase do **not** give you raw UDP from the phone — that still needs a downloadable app. They're a WebSocket-based middle tier, not a UDP transport.

### Downloadable app — does it expose more?

| route                       | extra access vs Safari                                                                                                       |
|-----------------------------|------------------------------------------------------------------------------------------------------------------------------|
| **PWA** (install Safari)    | Almost nothing extra — same web APIs, just full-screen. Still no UDP, still no HealthKit, still no native Bluetooth/MIDI.    |
| **Capacitor / Cordova**     | Bridges to native: HealthKit (with permissions), BLE, NFC, MIDI, file system, background audio, **UDP sockets** (so OSC is direct, no server bounce). |
| **React Native / Expo**     | Same bridges as Capacitor plus a richer ecosystem (`react-native-osc`, `expo-sensors`).                                       |
| **Native (Swift / Kotlin)** | Everything the OS exposes: HealthKit, ARKit camera frames at full FPS, BLE GATT server, Bonjour discovery for zero-config OSC, Core MIDI. |

The "go native to get UDP" angle is the most compelling — see next question.

### UDP/OSC — duplicating TouchOSC's role

Browsers **cannot** open raw UDP sockets, so the current template's "OSC"
is actually `WS → server → UDP-to-Max`. That puts the Node server in the
critical path, adds a few ms, and means OSC is local-only (no peer-to-peer
between two phones). That's fine for most pieces; for sample-rate-tight
control it's a real limit.

To get TouchOSC-equivalent direct-UDP-from-phone, you need a native or
hybrid app. The cleanest minimal-viable path:

1. **Capacitor** wrapper around this same `public/index.html`.
2. Add a Capacitor UDP plugin (e.g. `cordova-plugin-chrome-apps-sockets-udp`).
3. Inside the page, feature-detect: if `window.UDP` is present, send OSC
   directly to `cfg.oscHost:cfg.oscPort`; otherwise fall back to WS.

That keeps a single codebase for browser + installable app, and only the
"how do I emit OSC" function changes between the two.

Alternative (no app build at all): **use TouchOSC alongside this**. Phones
running TouchOSC speak OSC to Max directly; phones running this web page
provide the lobby + role logic. They coexist on the same `udpreceive` port.

## Cloud relay — audience + remote performers, generic across pieces

The LAN server (Max patch + `server.js`) keeps running unchanged. In
parallel, an optional **shared Cloudflare Worker** at `cloud/worker/`
bridges the same room to remote performers and audience over the public
internet.

**One Worker deploy serves every piece** built on this template. A new
piece picks a `<piece>` slug and connects to the existing relay; no
Worker redeploy needed.

```
                 ┌───────────────────────────────────────┐
                 │  Cloudflare Worker (mu-relay)         │
                 │  Durable Object per (piece, room)     │
                 └──────────────┬────────────────────────┘
                                │ wss
       ┌────────────────────────┼────────────────────────┐
       │                        │                        │
host ←─┤                  perform ←─┤              audience ←─┤
       │                            │                          │
       │                            │                          │
  ┌────▼────┐               ┌───────▼──────┐         ┌────────▼───────┐
  │ Max +   │               │ public/      │         │ public/?view=  │
  │ server. │               │ index.html   │         │ audience       │
  │ js as   │               │ (?cloud=...) │         │ (?cloud=...)   │
  │ "host"  │               └──────────────┘         └────────────────┘
  └─────────┘
       ▲
       │ ws
       │
  LAN phones (unchanged)
```

### One-time setup

```bash
cd cloud/worker
npm install
wrangler deploy
```

Copy the resulting `wss://mu-relay.<your-subdomain>.workers.dev` into the
patch's **Cloud URL** field.

Full deploy notes: [cloud/worker/README.md](cloud/worker/README.md).

### Per-piece setup (no Worker redeploy)

For each piece built on the template:

1. In the patch, set **Piece** (e.g. `immer-2026`) and **Room** (e.g. `main`).
2. Press **Cloud connect** — the patch's `server.js` opens a `host`
   WebSocket to the relay.
3. Hand out URLs:

   ```
   LAN performer:    http://<lan-ip>:8080/
   Remote performer: https://<your-static-host>/?cloud=wss%3A%2F%2Fmu-relay.<sub>.workers.dev&piece=immer-2026&room=main
   Audience:         https://<your-static-host>/?cloud=...&piece=immer-2026&room=main&view=audience
   ```

   For the canonical setup, `<your-static-host>` is
   `john.jann.one/<piece-repo>/` (GitHub Pages serves the `public/` folder).

### What audience can see and send

- **See:** the live roster (which performers are joined, their roles,
  whether the piece has started), and any `display` / `cmd` broadcasts
  the host scoped to `toRole: "audience"`.
- **Send (only):**
  - `audience-input` events from a 4-button pad + a slider (other
    inputs work too if you add them client-side).
  - `audience-react` events with an emoji.
  - `ping` for "I'm here."

These reach Max as `audience input <name> <kind> <id> <value>`,
`audience react <name> <emoji>`, etc., plus OSC at
`/audience/<name>/<kind>/<id>`.

### What remote performers see

The **same** Stage UI as LAN performers — every sensor tab, every test
page, the full synth output engine. Sensor data is unified in Max:
LAN and remote performers go through the same `Max.outlet` selectors and
the same OSC fan-out. The patch can tell them apart via the roster
(remote performers have `kind: "remote"` in the snapshot) but doesn't
have to.

## Files

| file                                  | role                                                                |
|---------------------------------------|---------------------------------------------------------------------|
| `multi-user-template.maxpat`          | The Max patch — config, transport, status, OSC receive, cloud relay, server host. |
| `server.js`                           | Node-for-Max server: HTTP + WS + OSC fan-out + admin auth + cloud bridge. |
| `public/index.html`                   | Single-page client shell.                                            |
| `public/style.css`                    | All CSS.                                                            |
| `public/app.js`                       | Client logic — lobby, stage, tabs, sensors, synth, audience view.   |
| `package.json`                        | Declares `ws` and `osc` dependencies.                                |
| `cloud/worker/`                       | Cloudflare Worker — generic relay, deployed once for ALL pieces.    |
| `cloud/worker/src/index.js`           | Worker entry: routes `/mu/<piece>/<room>/<role>` to a Durable Object. |
| `cloud/worker/src/room.js`            | `MuRoom` Durable Object — hibernation-aware fan-out by role.        |
| `CLAUDE.md`                           | Project-specific working notes.                                     |
