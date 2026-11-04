# Architecture

GRÜSSLE! is a client-side Vue 3 application built by Vite. `index.html` loads `src/main.js`, which mounts `App.vue` and imports the shared styles. The build produces static files and has no server application or external service integration.

## Components and boundaries

| Module | Responsibility |
| --- | --- |
| `src/App.vue` | Present the game as the entire application. |
| `src/components/GameView.vue` | Canvas element, HUD, menus, dialogue buttons, reaction and result screens, focus management, and clipboard fallback. |
| `src/composables/useGame.js` | Own reactive state, computed display values, keyboard input, frame scheduling, audio/renderer coordination, and clipboard requests. |
| `src/game/content.js` | Eight encounters, answer scores/replies, and the three location definitions. |
| `src/game/gameState.js` | Framework-independent state transitions, timing, scoring, result tiers, and share text. |
| `src/game/createWorldRenderer.js` | Draw the 540 × 960 Canvas 2D scene and manage feedback particles. It owns no animation loop. |
| `src/game/createAudio.js` | Lazily create a Web Audio context, synthesize effects and background music, duck music during effects, mute/pause active voices, and release resources. |
| `src/game/musicScore.js` | Original 16-bar waltz score, instrument note definitions, tempo, and music mix level. |
| `src/styles.css` | Layout, responsive sizing, interface appearance, and motion preferences. |

## Data flow

Button and keyboard input call the composable, which delegates validated answers to `gameState.js`. The state moves through `menu → approach → dialog → reaction`, repeating for eight encounters before `result`. Vue renders the relevant interface from this state. The composable triggers audio and visual feedback when an answer is accepted.

A single `requestAnimationFrame` loop advances the state machine and passes a snapshot of phase, encounter, timing, and approach progress to the renderer. Automatic demo choices use this same clock. Hidden documents skip updates; visibility changes reset the clock so resumed frames discard the hidden interval. Gameplay uses visible elapsed time, while particle frame deltas are capped at 40 ms. Manual dialogues wait indefinitely for an answer.

All game state stays in memory. Clipboard writing is the only result export; failed or unavailable clipboard access reveals a selectable text field. Request tracking prevents a pending copy operation from changing the UI after replay or unmount.

## Lifecycle

Mounting creates the canvas renderer, registers keyboard and document-visibility listeners, and starts the frame loop. Starting or replaying resets the state, renderer particles, and music sequence. The frame loop schedules music notes slightly ahead on the Web Audio clock; there is no separate music timer. Music plays during manual and automatic runs and stops at results. The Sound control mutes both music and effects. Hidden documents stop active and queued voices, and resuming schedules new notes without a catch-up burst. Unmounting cancels the frame, removes the listeners, clears the renderer, stops and disconnects audio voices and music bus nodes, and closes the audio context. Audio initialization failure is tolerated; canvas initialization failure leaves the DOM dialogue available.

Effects retain their original envelopes and direct output routing. Music uses a separate low-volume bus and 950 Hz low-pass filter. Each effect ducks that bus to 22% of its normal level, holds it through the effect's tail, then restores it over 280 ms. Overlapping effects extend the hold.

## Validation boundary

`tests/gameState.test.js` uses Node's built-in test runner without a browser or Vue runtime. It covers encounter structure, progression, scoring, invalid input, replay, simulated demo timing, result tiers, and share text. `tests/audio.test.js` checks music scheduling, effect routing, overlapping ducking, mute/pause, replay, device failure, and cleanup with a Web Audio test double. Browser smoke checks cover desktop/mobile layout, keyboard and pointer answers, canvas rendering, the complete demo, result copying, and replay. Real Web Audio rendering checks music/effect levels and clipping; speaker output and compatibility across other browsers still require device testing.
