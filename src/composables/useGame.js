import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { encounters, locations } from '../game/content.js'
import { createAudio } from '../game/createAudio.js'
import { createWorldRenderer } from '../game/createWorldRenderer.js'
import { chooseAnswer, createInitialState, createShareText, getResult, startGame, updateGame } from '../game/gameState.js'

export function useGame(canvas) {
  const state = reactive(createInitialState())
  const muted = ref(false)
  const soundHint = ref(false)
  const copyStatus = ref('idle')
  const canvasUnavailable = ref(false)
  const audio = createAudio()
  let renderer
  let frameId = 0
  let previousTime = null
  let hintRemaining = 0
  let copyRemaining = 0
  let disposed = false
  let copyRequest = 0

  const currentEncounter = computed(() => encounters[Math.min(state.index, encounters.length - 1)])
  const location = computed(() => locations[currentEncounter.value.place])
  const round = computed(() => Math.min(encounters.length,
    state.index + Number(['dialog', 'reaction'].includes(state.phase))))
  const progress = computed(() => state.index / encounters.length * 100)
  const tip = computed(() => state.phase === 'menu' || (state.index === 0 && state.phase === 'approach')
    ? 'Ohne Grüßle koa Punkte!' : currentEncounter.value.tip)
  const result = computed(() => getResult(state))
  const shareText = computed(() => createShareText(state))

  function start(mode = 'manual') {
    copyRequest += 1
    startGame(state, mode)
    renderer?.reset()
    copyStatus.value = 'idle'
    copyRemaining = 0
    previousTime = null
    audio.setMusicPlaying(true)
    audio.unlock()
    audio.play('bird')
  }

  function onReaction() {
    const good = state.reaction.delta >= 0
    audio.play(good ? 'good' : 'bad')
    renderer?.addFeedbackParticles(good)
  }

  function choose(answerIndex) {
    if (chooseAnswer(state, answerIndex)) onReaction()
  }

  function toggleSound() {
    muted.value = !muted.value
    audio.setMuted(muted.value)
    soundHint.value = true
    hintRemaining = 3.2
    if (!muted.value) audio.play('bird')
  }

  async function copyResult() {
    // Preserve this run's text even if the player replays while the clipboard is pending.
    const text = shareText.value
    const request = ++copyRequest
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(text)
      if (disposed || state.phase !== 'result' || request !== copyRequest) return
      copyStatus.value = 'copied'
      copyRemaining = 1.8
    } catch {
      if (!disposed && state.phase === 'result' && request === copyRequest) copyStatus.value = 'manual'
    }
  }

  function onKeydown(event) {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey
      || event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return
    if (event.target.closest?.('button') && ['Enter', ' '].includes(event.key)) return
    if (state.phase === 'menu' && ['Enter', ' '].includes(event.key)) {
      event.preventDefault()
      start()
    } else if (state.phase === 'dialog' && ['1', '2', '3'].includes(event.key)) {
      event.preventDefault()
      choose(Number(event.key) - 1)
    } else if (state.phase === 'result' && event.key === 'Enter') {
      event.preventDefault()
      start()
    }
  }

  function resetClock() {
    previousTime = null
    audio.setPaused(document.hidden)
  }

  function tick(timestamp) {
    frameId = window.requestAnimationFrame(tick)
    if (document.hidden) {
      previousTime = null
      return
    }
    const deltaTime = previousTime === null ? 0 : Math.max(0, (timestamp - previousTime) / 1000)
    previousTime = timestamp
    const oldPhase = state.phase
    updateGame(state, deltaTime)
    if (oldPhase !== state.phase) {
      if (state.phase === 'dialog') audio.play('bird')
      if (state.phase === 'reaction') onReaction()
      if (state.phase === 'result') {
        audio.setMusicPlaying(false)
        audio.play('good')
      }
    }
    audio.updateMusic()
    if (hintRemaining > 0) {
      hintRemaining -= deltaTime
      if (hintRemaining <= 0) soundHint.value = false
    }
    if (copyRemaining > 0) {
      copyRemaining -= deltaTime
      if (copyRemaining <= 0) copyStatus.value = 'idle'
    }
    renderer?.render({
      phase: state.phase, index: state.index, time: state.time,
      ambient: state.ambient, approach: state.approach, deltaTime: Math.min(0.04, deltaTime),
    })
  }

  onMounted(() => {
    try {
      renderer = createWorldRenderer(canvas.value, encounters, locations)
    } catch {
      canvasUnavailable.value = true
    }
    window.addEventListener('keydown', onKeydown)
    document.addEventListener('visibilitychange', resetClock)
    resetClock()
    frameId = window.requestAnimationFrame(tick)
  })

  onBeforeUnmount(() => {
    disposed = true
    window.cancelAnimationFrame(frameId)
    window.removeEventListener('keydown', onKeydown)
    document.removeEventListener('visibilitychange', resetClock)
    renderer?.dispose()
    audio.dispose()
  })

  return {
    state, muted, soundHint, copyStatus, canvasUnavailable, currentEncounter, location,
    round, progress, tip, result, shareText, start, choose, toggleSound, copyResult,
  }
}
