import { encounters } from './content.js'

export const TIMING = {
  manual: { approach: 1.27, reaction: 1.7 },
  auto: { approach: 0.625, dialog: 3, reaction: 2.5 },
}

const demoAnswers = [0, 1, 0, 1, 0, 0, 0, 0]

export function createInitialState() {
  return {
    phase: 'menu',
    mode: 'manual',
    index: 0,
    score: 0,
    hits: 0,
    streak: 0,
    bestStreak: 0,
    approach: 0,
    time: 0,
    ambient: 0,
    phaseElapsed: 0,
    reaction: null,
    toastRemaining: 0,
  }
}

export function startGame(state, mode = 'manual') {
  Object.assign(state, createInitialState(), { phase: 'approach', mode })
}

function enterPhase(state, phase) {
  state.phase = phase
  state.phaseElapsed = 0
}

export function chooseAnswer(state, answerIndex) {
  const encounter = encounters[state.index]
  if (state.phase !== 'dialog' || !encounter || !Number.isInteger(answerIndex)
    || answerIndex < 0 || answerIndex >= encounter.choices.length) return false

  const delta = encounter.scores[answerIndex]
  const perfect = delta === Math.max(...encounter.scores)
  state.score += delta
  state.hits += Number(perfect)
  state.streak = perfect ? state.streak + 1 : 0
  state.bestStreak = Math.max(state.bestStreak, state.streak)
  state.reaction = {
    name: encounter.name,
    reply: encounter.replies[answerIndex],
    delta,
    perfect,
    caption: perfect ? 'Perfekte Antwort!'
      : delta >= 0 ? 'Nicht schlecht … aber es geht besser.' : 'Oha. Jetzt wird’s schwierig.',
  }
  state.toastRemaining = 0.68
  enterPhase(state, 'reaction')
  return true
}

// One clock drives walking and dialogue; there are no delayed callbacks to leak into a replay.
export function updateGame(state, deltaTime) {
  if (!Number.isFinite(deltaTime) || deltaTime <= 0) return
  state.time += deltaTime
  state.ambient += deltaTime
  state.toastRemaining = Math.max(0, state.toastRemaining - deltaTime)
  state.phaseElapsed += deltaTime
  const timing = TIMING[state.mode]

  if (state.phase === 'approach') {
    state.approach = Math.min(1, state.phaseElapsed / timing.approach)
    if (state.approach >= 1) enterPhase(state, 'dialog')
  } else if (state.phase === 'dialog' && state.mode === 'auto') {
    if (state.phaseElapsed >= timing.dialog) chooseAnswer(state, demoAnswers[state.index])
  } else if (state.phase === 'reaction' && state.phaseElapsed >= timing.reaction) {
    state.index += 1
    state.reaction = null
    state.approach = 0
    enterPhase(state, state.index === encounters.length ? 'result' : 'approach')
  }
}

export function getResult(state) {
  if (state.score >= 88) return {
    title: 'A ECHTS KÄPSELE!',
    description: 'Der Ulmer Spatz nickt anerkennend. Mehr Lob gibt’s heut net.',
  }
  if (state.score >= 48) return {
    title: 'NED SCHLECHT!',
    description: 'Du bisch auf em beschda Weg. Beim nächsten Mal klappt sogar d’Kehrwoch.',
  }
  return {
    title: 'HA NOI!',
    description: 'Keine Sorge. So fängt jede schöne Bekanntschaft an.',
  }
}

export function createShareText(state) {
  return `GRÜSSLE! — Mein Schwaben-Respekt: ${state.score} 🥨 | ${state.hits}/${encounters.length} Volltreffer | SPATZVERSE · A bissle Ulm. A bissle Chaos.`
}

export function signedScore(score) {
  return `${score >= 0 ? '+' : ''}${score}`
}
