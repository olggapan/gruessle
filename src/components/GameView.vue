<script setup>
import { nextTick, ref, watch } from 'vue'
import { useGame } from '../composables/useGame.js'
import { encounters, locations } from '../game/content.js'
import { signedScore } from '../game/gameState.js'

const canvas = ref(null)
const choicesPanel = ref(null)
const replayButton = ref(null)
const shareField = ref(null)
const {
  state, muted, soundHint, copyStatus, canvasUnavailable, currentEncounter, location,
  round, progress, tip, result, shareText, start, choose, toggleSound, copyResult,
} = useGame(canvas)

watch(() => state.phase, async (phase) => {
  await nextTick()
  if (phase === 'dialog' && state.mode === 'manual') {
    choicesPanel.value?.querySelector('button')?.focus({ preventScroll: true })
  }
  if (phase === 'result') replayButton.value?.focus({ preventScroll: true })
})

watch(copyStatus, async (status) => {
  if (status !== 'manual') return
  await nextTick()
  shareField.value?.focus({ preventScroll: true })
  shareField.value?.select()
})
</script>

<template>
  <section class="phone" aria-label="GRÜSSLE! Spiel">
    <canvas ref="canvas" width="540" height="960" aria-label="Ulmer Straße mit Bewohnern und deinem Charakter">
      Eine gezeichnete Straße in Ulm. Alle Begegnungen kannst du mit den Antwortknöpfen spielen.
    </canvas>
    <div class="shade" aria-hidden="true"></div>
    <p v-if="canvasUnavailable" class="canvas-notice">Die Grafik ist nicht verfügbar. Du kannst trotzdem mitspielen.</p>

    <header class="hud">
      <div>
        <div class="micro">SPATZVERSE // EP. 01</div>
        <div class="logo">GRÜSSLE<span class="star">!</span></div>
      </div>
      <div class="hudstats">
        <span class="pill" aria-label="Begegnungen">{{ round }} / {{ encounters.length }}</span>
        <span class="pill" aria-label="Schwaben-Respekt">🥨 <b>{{ state.score }}</b></span>
      </div>
    </header>
    <div class="progress" role="progressbar" aria-label="Spielfortschritt" :aria-valuenow="state.index" :aria-valuemax="encounters.length" aria-valuemin="0">
      <div :style="{ width: `${progress}%` }"></div>
    </div>
    <div class="street-label">{{ location.name }}</div>

    <button
      class="sound" type="button" :disabled="state.phase === 'menu' || state.phase === 'result'"
      :aria-pressed="!muted" aria-label="Sound" @click="toggleSound"
    >♫ SOUND {{ muted ? 'OFF' : 'ON' }}</button>
    <div v-if="soundHint" class="sound-hint" role="status" lang="en">
      Original recordings needed for an authentic Ulm dialect. This game uses only original synthetic game sounds.
    </div>
    <div class="spatz">
      <span class="spatz-tip">{{ tip }}</span><span class="spatz-avatar" aria-hidden="true">🐦</span>
    </div>
    <div class="toast" :class="{ show: state.toastRemaining > 0 }" aria-hidden="true">
      {{ state.reaction ? signedScore(state.reaction.delta) : '' }}
    </div>
    <div class="subbar" aria-hidden="true">
      {{ state.phase === 'menu' ? 'WALKING THROUGH ULM · SPACE TO PLAY'
        : state.mode === 'auto' ? 'AUTO REEL · GAMEPLAY DEMONSTRATION' : 'EINE ANTWORT AUSWÄHLEN · 1 / 2 / 3' }}
    </div>

    <section v-if="state.phase === 'dialog'" ref="choicesPanel" class="interaction" aria-labelledby="encounter-prompt" aria-describedby="encounter-speaker">
      <div id="encounter-speaker" class="speaker">BEGEGNUNG {{ state.index + 1 }}/{{ encounters.length }} · {{ currentEncounter.name }}</div>
      <h2 id="encounter-prompt" class="prompt">{{ currentEncounter.line }}</h2>
      <button v-for="(choice, index) in currentEncounter.choices" :key="`${state.index}-${index}`" class="choice" type="button" @click="choose(index)">
        <span class="num" aria-hidden="true">{{ index + 1 }}</span><span>{{ choice }}</span>
      </button>
    </section>

    <div v-if="state.phase === 'reaction' && state.reaction" class="reaction" role="status">
      <div class="speaker">{{ state.reaction.name }}</div>
      <div class="quote">„{{ state.reaction.reply }}“</div>
      <div class="small">{{ state.reaction.caption }}</div>
      <div class="score" :class="{ negative: state.reaction.delta < 0 }">{{ signedScore(state.reaction.delta) }} 🥨</div>
    </div>

    <div v-if="state.phase === 'menu'" class="overlay">
      <div class="menu-inner">
        <h1 class="hero-title">GRÜSS<span>LE!</span></h1>
        <div class="location-icons" aria-hidden="true">⛪ 🐦 🌊</div>
        <p class="hero-sub">Wie viel <b>Schwaben-Respekt</b> schaffsch du in Ulm?</p>
        <button class="cta" type="button" @click="start()">LOS GEHT'S →</button>
        <button class="cta alt" type="button" @click="start('auto')">▶ REEL DEMO · ~50 SEK.</button>
        <p class="menu-note">8 Begegnungen · 3 Ulmer Orte · 3 Antworten pro Person<br>Handy: Tippen · Desktop: Taste 1 / 2 / 3</p>
      </div>
    </div>

    <div v-if="state.phase === 'result'" class="result" aria-labelledby="result-title">
      <div class="result-inner">
        <div class="overline">DEIN ULM-ZEUGNIS</div>
        <h2 id="result-title">{{ result.title }}</h2>
        <div class="result-score">{{ signedScore(state.score) }}</div>
        <p class="result-info">{{ result.description }}</p>
        <div class="result-stats">
          <div><b>{{ state.hits }}</b>Volltreffer</div>
          <div><b>{{ state.bestStreak }}</b>Beste Serie</div>
          <div><b>{{ locations.length }}</b>Orte</div>
        </div>
        <button ref="replayButton" class="cta" type="button" @click="start()">NOCH A RUNDE →</button>
        <button class="cta alt" type="button" @click="copyResult">{{ copyStatus === 'copied' ? '✓ KOPIERT' : '↗ ERGEBNIS KOPIEREN' }}</button>
        <p class="sr-only" role="status">{{ copyStatus === 'copied' ? 'Ergebnis kopiert.' : '' }}</p>
        <label v-if="copyStatus === 'manual'" class="share-fallback">
          Bitte kopiere dein Ergebnis hier:
          <textarea ref="shareField" :value="shareText" readonly rows="3" @focus="$event.target.select()"></textarea>
        </label>
        <div class="copyright" lang="en">Fan game · not affiliated with the City of Ulm</div>
      </div>
    </div>
  </section>
</template>
