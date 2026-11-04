# Technical decisions

## Game-only application

The application presents the playable game without the prototype's introduction or explanatory sidebar. Desktop centers the portrait playfield, while mobile uses the available screen. The start menu, controls, encounter feedback, and results remain part of the game.

## Vue UI with independent game modules

The application uses Vue 3 single-file components and the Composition API for interface state and lifecycle. Encounter data, the game state machine, rendering, and audio remain separate modules. This preserves the prototype's content while allowing gameplay rules to be tested without mounting Vue or a browser. The single-screen game does not need a router or a global state library.

## Preserve procedural artwork and synthesized sound

The existing Canvas 2D scene remains procedural at a fixed 540 × 960 drawing resolution, scaled by CSS. Web Audio synthesizes the existing effects and an original background score. The reference PNGs are not runtime assets. This keeps the app self-contained and preserves its visual identity without adding an asset pipeline, third-party media, or services. Recorded regional dialogue is outside the implementation.

## Keep background music subordinate to effects

The background score is a relaxed 92 BPM folk-style waltz with plucked triangle-wave melody, sine-wave bass, and soft off-beat chords. Its 16 bars loop in approximately 31 seconds. A quiet, low-pass-filtered music bus leaves room for the existing feedback sounds and ducks automatically whenever an effect plays. Effects keep their original frequencies, levels, and timing. The existing Sound control governs both layers, and music uses the game's frame loop for scheduling and lifecycle cleanup.

## One lifecycle-owned clock

The composable owns one animation loop, and the state machine receives elapsed seconds explicitly. Approach, automatic dialogue, reaction, and toast timing no longer depend on separate delayed gameplay callbacks. Replay can reset the complete run synchronously, and component teardown has one scheduled frame to cancel. Background tabs pause progression rather than skipping encounters while unseen.

## Allow time to read the automatic demo

Automatic mode holds each question and its three choices for 3 seconds, followed by 2.5 seconds of answer feedback, so viewers have time to read both. With 0.625 seconds of approach per encounter, the eight encounters total 49 seconds before frame rounding; the menu advertises approximately 50 seconds. The original scripted answer sequence produces 74 points and 6 hits. Manual reaction timing and the underlying scoring are unchanged.

## Static delivery and in-memory progress

Vite builds static files with relative asset URLs (`base: './'`). There is no backend, persistence, account system, or deployment-specific configuration. This supports local development and static hosting; page refresh starts a new game. Share output is plain text copied through the browser clipboard with a manual fallback.
