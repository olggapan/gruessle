# SPATZVERSE / GRÜSSLE! — Creative universe and playable MVP

**Tagline:** A bissle Ulm. A bissle Chaos.  
**Format:** Vertical short-form video + browser mini-games + user-submitted local dialogue and sounds.  
**Prototype:** `spatzverse_gruessle.html` (one-file, offline, no external assets or framework).

## The core insight from the reference Reel

The Swiss hiking video (20 seconds, provided by the project owner) works because it turns familiar, low-stakes social etiquette into an unusually satisfying score loop. It combines **recognizable setting + authentic language + sound + NPC reactions + immediate feedback + shareable surprise**. Its specific hiking scenery and characters should not be copied directly. Build the same *category* of local interaction using original art and mechanics.

## Universe pitch

SPATZVERSE is an affectionate, surreal, mostly original fictional city inspired by Ulm and Neu-Ulm. Everyday regional moments are heightened into game rules. The recurring narrator is a confident little **Ulmer Spatz** (fictional character inspired by the city's traditional sparrow symbol). The player is a newcomer who learns the city by meeting people. Humor targets the *situation*, not the intelligence or worth of dialect speakers or newcomers.

### Expansion map

| Episode | Format | Emotional hook | Natural social-media moment |
|---|---|---|---|
| 01 — GRÜSSLE! | NPC encounter/choice runner | Small talk and awkward greetings | The wrong answer gets an exaggerated response |
| 02 — KEHRWOCH: Endgegner | Cleaning arcade/physics | Impossible-to-satisfy neighbor | One new leaf falls every time the player finishes |
| 03 — NABADA ROYALE | Raft dodging game | Seasonal local festival | Final seconds of a ridiculous river collision |
| 04 — DIE ANDERE SEITE | Branching bridge adventure | Ulm/Neu-Ulm inside joke | Two sets of rules on opposite sides of the bridge |
| 05 — SPATZBEATS | Browser music toy | Local voice/music culture | User creates a 15-second beat using licensed local recordings |

## GRÜSSLE! v0.1 implementation: DONE

- Self-contained HTML/CSS/JavaScript, drawn with the Canvas 2D API in a **2.5D perspective illustration** (not genuine 3D).
- Mobile-oriented 9:16 game area plus desktop explainer panel.
- A third-person walking character and approaching NPCs, moving environment, animated crow/sparrow-themed narrator.
- 8 scripted encounters, 3 location backgrounds: Münsterplatz, Fischerviertel, Donaubrücke.
- Each encounter: player picks 1 of 3 responses; point gain/loss and individual NPC reaction follows.
- Summary: total score, best combo, and correct response count, copy-to-clipboard share text.
- Keyboard keys 1/2/3 or touch, replay and **~25-second automatic demonstration** for capture.
- Original, simple Web Audio synthetic interface cues. No speech playback or original street recordings yet.
- **No online leaderboard, real-world geolocation, user accounts, AI generation, multiplayer, analytics or actual dialect voiceover**. This is an interactive concept prototype, not a shipped public game.

## Play and record

1. Open `spatzverse_gruessle.html` in a desktop or mobile browser. Click **LOS GOHT'S** and choose options by tapping or pressing 1/2/3.
2. For a video demonstration, click **25-SEC REEL DEMO**, record only the left-hand 9:16 game area, and overlay licensed dialogue recordings in editing.
3. For final video exports: 1080×1920, subtitles with an optional Hochdeutsch translation, strong payoff in the first 2 seconds, 18–25 seconds for the initial social clip.
4. The share button copies a score message, **not a deployed game link**. Host the HTML over HTTPS before distributing a playable public link.

## Authentic dialect production plan

**Important:** Swabian varies by locality, age, family, and social setting. The prototype dialogue is creatively drafted, not phonologically verified. Words/idioms with broader Swabian documentation include *Kehrwoch*, *Weckle*, *Gsälz*, *Käpsele*, and *Ha noi*. German *Grüß Gott* is used across southern German-speaking areas and is not uniquely Ulmian.

1. Recruit 3–5 speakers from Ulm, Neu-Ulm, Laupheim/Alb-Donau, plus a newcomer; include different ages/strengths of accent.
2. Have them read the 8 encounter lines naturally and correct the language **before** recording. Let speakers replace written lines if they would never really say them.
3. Record mono WAV 48kHz, with consent/license for game, social posts, edits and promotion. Get a clean, quiet take plus one exaggerated comedic take.
4. Preserve both dialect and Hochdeutsch subtitles. Never pretend generic browser TTS is authentic Swabian.
5. Keep a glossary JSON with `text`, `locale_variant`, `translation`, `voiceAsset`, `speakerPermission` and recording credit.

## Three 20-second video experiments

### A. Greetings / social awkwardness
- 0–2s: title “Kannst du in Ulm überleben, ohne zu grüßen?” and NPC approaches.
- 2–6s: a friendly elder greets you; choosing “Moin” gets mild teasing.
- 6–12s: another NPC asks about Kehrwoch; choose a ridiculous excuse.
- 12–17s: the Spatz awards absurd *Schwaben-Respekt*.
- 17–20s: “Welches Antwort wär richtig? Schreib's in d'Kommentare.”

### B. Kehrwoch boss / physical comedy
- 0–3s: “ENDGEGNER: DEINE NACHBARIN”.
- 3–11s: player sweeps the street, progress reaches 99%; a single leaf lands.
- 11–17s: neighbor appears: “Des Eckle hasch vergessa!” (speaker to verify).
- 17–20s: next-level challenge prompt.

### C. Ulm / Neu-Ulm border
- 0–3s: walking across the Danube, overlay “Entering Bavaria”.
- 3–12s: NPCs briefly behave according to absurd made-up video-game rules.
- 12–17s: the Spatz demands a “Grüßle-Pass”.
- 17–20s: viewer poll: “Team Ulm oder Team Neu-Ulm?”

**Creative test:** post 3 original short videos at similar times and compare not only views, but shares per view, tagged friends, comment sentiment/recall, and taps to the actual playable game. Do not assume local virality is guaranteed.

## Two-week next steps

- **Days 1–2:** Show the HTML prototype to 5 people familiar with Ulm and 3 newcomers; ask which jokes land, which sound artificial and whether they understand the scoring loop without explanation.
- **Days 3–4:** Rewrite 8 scenes based on local feedback; record explicit-rights, authentic dialect performances.
- **Days 5–7:** Add recordings, footsteps and better UI pacing; create first 3 organic social-video edits and publish a HTTPS demo.
- **Days 8–10:** Track qualitative reaction and completion; identify the strongest 2 jokes and whether people share the game itself.
- **Days 11–14:** Improve the winning loop, add one alternate NPC or “daily scenario”; decide whether to advance to a full Three.js 3D renderer or expand the episodes.

### Technical upgrade path

For future scale: Vue 3 / TypeScript / Vite for application shell and content management; Three.js for authored low-poly Ulm models; Web Audio for mixing and synchronized music; JSON-driven dialogue state machine; a lightweight backend (e.g., Supabase) only if actual public scoring/submissions are validated. Retain a renderer-independent NPC encounter model. Start without user accounts.

### Rights and local credibility

- All art in the prototype is procedurally drawn. Do not lift sprites or gameplay video from the Swiss Reel.
- Local place names and traditions are cultural references, not endorsements by the City of Ulm.
- Only use music, recorded speech, photographs, dialect recordings or crowd submissions with appropriate rights and consent.
- Represent Swabian as part of a varied living culture, not as a uniform accent spoken by everybody in Ulm.

### Grounding references

- City of Ulm: [Ulmer Spatz legend](https://www.ulm.de/tourismus/stadtgeschichte/markenzeichen/ulmer-spatz)
- City of Ulm: [Fischer- und Gerberviertel](https://www.ulm.de/tourismus/fischerviertel)
- City of Ulm: [Nabada tradition and satirical boats](https://www.ulm.de/tourismus/stadtgeschichte/feste-und-traditionen/nabada)
- Duden: [Kehrwoche — between tradition and cliché](https://www.duden.de/schwaebisch)
- SWP: [Dialect vocabulary and local variants](https://www.swp.de/baden-wuerttemberg/dialekt-in-baden-wuerttemberg-die-wichtigsten-ausdruecke-die-man-im-schwobalaendle-kenna-sodd-78574035.html)

