# Current state

## Implemented

- Runnable Vue 3 / Vite application with development, test, build, and preview commands and a committed dependency lockfile.
- Shared links to the production site use static Open Graph and X Card metadata with an illustrated Ulm sparrow preview.
- Eight encounters across Münsterplatz, Fischerviertel, and Donaubrücke, retaining the prototype's dialogue, answer values, result tiers, and procedural world artwork.
- Manual play by pointer, touch, or number keys; keyboard start/replay; automatic demo; score, hit count, streak tracking, and result copying.
- Replay resets the run and feedback. A perfect run scores 114 points with 8 hits; the automatic demo scores 74 with 6 hits in approximately 50 seconds of active play, holding questions and choices for 3 seconds and answer reactions for 2.5 seconds.
- Game-only layout: a centered portrait game on desktop and an edge-to-edge game on mobile, with no introduction or explanatory sidebar. Includes focus handling, result announcements, manual clipboard fallback, and playable dialogue if canvas initialization fails.
- Original synthesized background waltz (92 BPM, 16 bars) with soft melody, bass, and chords. Music plays during manual/demo runs, automatically dips under the original effects, and stops at results. Shared mute control, background-tab pausing, and cleanup cover both audio layers.
- Fifteen behavioral tests cover game progression, scoring, and audio scheduling, ducking, mute/pause, replay, device failure, and cleanup. The production build passes.
- Browser smoke checks confirmed desktop and mobile gameplay layouts, number-key and pointer answers, a complete automatic run ending at 74 points, result copying, and replay resetting the score and location.
- Chromium audio checks confirmed no audio context before starting, shared mute, visibility pause/resume, a single context across replay, and silence after the result effect. Offline Web Audio rendering confirmed music ducking to 22% during feedback, effects clearly above the ducked music level, and no clipping in the sampled mix. A standalone score preview is available at `artifacts/audio/a-bissle-ulm.wav`; the game synthesizes its music at runtime.

## Limitations and remaining scope

- Progress and preferences exist only in memory. There are no accounts, persistence, leaderboards, multiplayer features, or backend.
- Sound uses synthesized music and effects; no dialect voiceover or recorded dialogue is included. The dialogue is fictional and has not been linguistically certified.
- Artwork uses Canvas 2D with a fixed logical resolution. It is a procedural perspective scene, not a 3D engine.
- Demo duration measures active simulation time. Background tabs pause it, and low frame rates can increase wall-clock duration.
- Clipboard availability depends on browser permissions and secure context support; the result screen provides a manual copy field.
- Automated tests exercise game logic and audio scheduling/mixing behavior. They do not establish cross-browser compatibility, perceived speaker balance, or visual correctness.
- The audio ducking test fails its assertion that the ducked music peak stays below half the quietest effect peak. The other 14 tests pass.

The original HTML, supplied PNGs, and MVP brief are retained as references. `src/` is the runnable implementation and the source of truth for its behavior.
