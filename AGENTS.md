# GRÜSSLE!

## Project rules

- This is a Vue 3 / Vite browser game. Keep the original dialogue, scoring, locations, and procedural Canvas 2D artwork unless a task explicitly changes them.
- The application is only the game. Keep introductions, marketing copy, and explanatory sidebars out of the playable UI.
- `spatzverse_gruessle.html` and the supplied PNGs are reference artifacts. The runnable application lives in `src/`.
- Keep encounter content, the game state machine, canvas drawing, and audio separate from Vue UI components.
- All artwork is procedural and all audio is synthesized. Do not introduce external assets, accounts, or a backend without a requirement.
- Clean up animation frames, browser listeners, and audio resources when Vue unmounts.

## Commands and validation

- `npm install` installs dependencies; `npm ci` installs from the lockfile.
- `npm run dev` starts the local development server.
- `npm test` checks game progression and scoring.
- `npm run build` produces `dist/`; `npm run preview` serves that build.
- After gameplay changes run tests and a production build, then check a complete run, replay, keyboard input, demo mode, and mobile layout in a browser. Inspect screenshots for canvas changes.

## Project memory

Read relevant documents in `docs/` before substantial work. Keep architecture, decisions, and current state aligned with the implementation. Do not record routine development logs.
