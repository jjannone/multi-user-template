// audio-bridge.js — pokes incoming mic samples into a buffer~ so that
// [wave~ mu_audio] downstream can play them back to dac~ / live.scope~.
//
// Loaded by [v8 audio-bridge.js] in multi-user-template.maxpat.
//
// Wiring inside the patch:
//
//   server.js (Node-for-Max)
//     ↓  Max.outlet("focus", "audio", s0, s1, ... sN)
//   [route-focus]            outlet matches "audio"
//     ↓
//   [v8 audio-bridge.js]      ← this file's `list` receives s0..sN
//     ↓ writes into buffer~ "mu_audio" cyclically
//   [buffer~ mu_audio 96000 1]   ≈ 2 s at 48 kHz, mono
//     ↓
//   [phasor~ 0.5] → [wave~ mu_audio]   ← reads buffer continuously
//     ↓
//   [dac~] + [live.scope~]
//
// The write head wraps with the buffer length, so the buffer always
// holds the most recent ~2 s of audio. The read head (driven by
// phasor~ 0.5) sweeps the whole buffer once every 2 s. The two heads
// are unsynchronised — at any moment the read head may be slightly
// ahead of or behind the write head — which produces tiny audible
// "seam" clicks when they cross. Acceptable for monitoring; for
// glitch-free playback the read head would need to chase the write
// head at a fixed lag.

inlets  = 1;
outlets = 0;

var BUF_NAME = "mu_audio";
var buf      = null;
var writeIdx = 0;

function loadbang()
{
	openBuffer();
}

function openBuffer()
{
	// new Buffer(name) attaches to the buffer~ named <name> in the patch.
	// If the buffer~ object isn't created yet (loadbang race), framecount()
	// returns 0; we re-try on the first incoming list.
	buf = new Buffer(BUF_NAME);
}

// Pokes a chunk of float samples into the buffer~, wrapping past the
// end so the buffer is always the most-recent N samples.
function list()
{
	if (!buf) openBuffer();
	if (!buf) return;

	var frames = buf.framecount();
	if (frames <= 0) {
		// buffer~ might not be loaded yet; try once more next call.
		openBuffer();
		return;
	}

	// arguments → Array (modern v8 in Max 9 supports the spread, but we
	// stick to arguments + Array.from for compatibility with older js
	// hosts that might also load this file).
	var samples = new Array(arguments.length);
	for (var i = 0; i < arguments.length; i++) samples[i] = arguments[i];

	var len = samples.length;
	if (writeIdx + len <= frames) {
		// fits in one contiguous span
		buf.poke(1, writeIdx, samples);
		writeIdx = (writeIdx + len) % frames;
	} else {
		// wrap: write the tail of the buffer, then the head
		var first  = frames - writeIdx;
		var part1  = samples.slice(0, first);
		var part2  = samples.slice(first);
		buf.poke(1, writeIdx, part1);
		buf.poke(1, 0, part2);
		writeIdx = part2.length;
	}
}

function reset()
{
	writeIdx = 0;
}

function bang()
{
	openBuffer();
	post("audio-bridge: buf=" + (buf ? buf.framecount() : "null") + " frames, writeIdx=" + writeIdx + "\n");
}
