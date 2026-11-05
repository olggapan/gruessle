# GRÜSSLE!

A runnable Vue 3 browser game converted from the SPATZVERSE HTML prototype. Walk through three Ulm locations, answer eight residents, and collect Schwaben-Respekt. The original dialogue, scoring, and procedural Canvas 2D artwork are retained. The application contains only the game, centered on desktop and filling the mobile screen.

## Run locally

Use Node.js 20.19 or newer within the 20.x series, or Node.js 22.12 or newer, with npm. The exact engine range is `^20.19.0 || >=22.12.0`.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://127.0.0.1:5173`. No environment variables, service accounts, or backend setup are required. Use `npm install` when intentionally updating dependencies; `npm ci` installs the committed lockfile.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server on localhost. |
| `npm test` | Run game-state, encounter, and audio tests with Node's test runner. |
| `npm run build` | Build the static application into `dist/`. |
| `npm run preview` | Serve the production build locally, normally on port 4173. |

To inspect a production build, run `npm run build` followed by `npm run preview`. The generated `dist/` directory can be served by a static web host; Vite uses relative asset paths.

## Play

- Start with **LOS GOHT'S**, Enter, or Space.
- Click or tap a reply, or press **1**, **2**, or **3** during a dialogue.
- Toggle background music and sound effects together with the Sound button during play. The original 92 BPM folk-style waltz stays quiet and automatically dips under effects.
- Choose **REEL DEMO · ~50 SEK.** for an automatic run, with 3 seconds to read each question and its choices and 2.5 seconds for each answer reaction.
- Replay from the result screen and copy the result text. A selectable text field appears if clipboard access is unavailable.

A perfect run earns **114 points**, **8 hits**, and a best streak of **8**. The automatic demo earns **74 points** and **6 hits** in approximately 50 seconds of active play. Background tabs pause progression, and slow rendering can extend elapsed time.

## Record a social video

The optional scripts in `scripts/` capture a real manual playthrough with the demo's answer pattern (74 points, 6 hits). They hold the opening for at least 10 seconds and the result for at least 8 seconds, hover each selected answer before clicking, and record the game's Web Audio output. Export paces active gameplay up to 1.5× while allowing at least 5.5 seconds per question before the click request, preserving sound pitch and the opening/results holds. The native portrait capture is scaled to 1080 × 1920. The app's source and gameplay are unchanged.

With Playwright/Chromium and a full FFmpeg installation available, run `node scripts/record-social-video.mjs`, then `node scripts/encode-social-video.mjs`. Set `PLAYWRIGHT_MODULE` to a shared Playwright module path if it is not locally installed, `CHROMIUM_PATH` to the browser executable if needed, and `FFMPEG_PATH` to the encoder executable. The recorder starts its own local Vite server on port 5188. Output, source frames, audio, and timing metadata go into the ignored `artifacts/social-video/` directory. The final file is `gruessle-74-points-vertical.mp4` (1080 × 1920, H.264/AAC, 30 fps).

## Source and references

The runnable application is in `src/`. `src/components/` contains the Vue interface; `src/composables/useGame.js` connects it to the game modules in `src/game/`. Tests are in `tests/`.

`spatzverse_gruessle.html`, `spatzverse_preview.png`, `spatzverse_gameplay.png`, and `SPATZVERSE_MVP_BRIEF.md` remain reference artifacts. The app does not load the prototype HTML or the supplied images at runtime.

See [architecture](docs/ARCHITECTURE.md), [decisions](docs/DECISIONS.md), and [current state](docs/CURRENT_STATE.md) for project details. Framework references: [Vue guide](https://vuejs.org/guide/introduction.html) and [Vite guide](https://vite.dev/guide/).

## Scope

This is a browser-only game with in-memory state. Refreshing the page resets the run; there is no account, saved progress, leaderboard, or backend. Graphics are drawn by code, and audio consists of synthesized music and effects without recorded dialogue. A modern browser with Canvas 2D support is needed for the artwork; the dialogue remains playable if canvas initialization fails.
