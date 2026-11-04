import test from 'node:test'
import assert from 'node:assert/strict'
import { encounters, locations } from '../src/game/content.js'
import {
  TIMING,
  chooseAnswer,
  createInitialState,
  createShareText,
  getResult,
  signedScore,
  startGame,
  updateGame,
} from '../src/game/gameState.js'

function reachDialog(state) {
  assert.equal(state.phase, 'approach')
  updateGame(state, TIMING[state.mode].approach)
  assert.equal(state.phase, 'dialog')
}

function finishReaction(state) {
  assert.equal(state.phase, 'reaction')
  updateGame(state, TIMING[state.mode].reaction)
}

function playRun(answers) {
  const state = createInitialState()
  startGame(state)
  for (const answer of answers) {
    reachDialog(state)
    assert.equal(chooseAnswer(state, answer), true)
    finishReaction(state)
  }
  assert.equal(state.phase, 'result')
  return state
}

test('all eight encounters have playable choices and belong to a location', () => {
  assert.equal(encounters.length, 8)
  assert.deepEqual(locations.map(({ name }) => name), [
    'ULM · MÜNSTERPLATZ',
    'ULM · FISCHERVIERTEL',
    'ULM · DONAUBRÜCKE',
  ])
  for (const encounter of encounters) {
    assert.ok(locations[encounter.place], `${encounter.name} needs a valid location`)
    assert.ok(encounter.line.length > 0)
    assert.equal(encounter.choices.length, 3)
    assert.equal(encounter.replies.length, encounter.choices.length)
    assert.equal(encounter.scores.length, encounter.choices.length)
    assert.ok(encounter.choices.every((choice) => typeof choice === 'string' && choice.length > 0))
    assert.ok(encounter.replies.every((reply) => typeof reply === 'string' && reply.length > 0))
    assert.ok(encounter.scores.every(Number.isFinite))
  }
})

test('a perfect run visits all encounters and earns 114 points and eight consecutive hits', () => {
  const state = createInitialState()
  startGame(state)
  const expectedTotals = [14, 26, 41, 56, 69, 81, 96, 114]

  for (let index = 0; index < encounters.length; index += 1) {
    assert.equal(state.index, index)
    reachDialog(state)
    assert.equal(chooseAnswer(state, 0), true)
    assert.equal(state.score, expectedTotals[index])
    assert.equal(state.hits, index + 1)
    assert.equal(state.streak, index + 1)
    assert.equal(state.reaction.name, encounters[index].name)
    assert.equal(state.reaction.reply, encounters[index].replies[0])
    assert.equal(state.reaction.perfect, true)
    finishReaction(state)
  }

  assert.equal(state.phase, 'result')
  assert.equal(state.index, 8)
  assert.equal(state.score, 114)
  assert.equal(state.hits, 8)
  assert.equal(state.streak, 8)
  assert.equal(state.bestStreak, 8)
  assert.equal(state.reaction, null)
})

test('negative answers can produce a negative final score without recording hits', () => {
  const state = playRun([2, 1, 2, 1, 2, 2, 1, 2])
  assert.equal(state.score, -42)
  assert.equal(state.hits, 0)
  assert.equal(state.streak, 0)
  assert.equal(state.bestStreak, 0)
})

test('both negative and positive non-perfect answers reset the current streak', () => {
  const state = createInitialState()
  startGame(state)
  const answers = [0, 0, 2, 1, 0, 0, 2, 2]
  const expectedStreaks = [1, 2, 0, 0, 1, 2, 0, 0]

  answers.forEach((answer, index) => {
    reachDialog(state)
    chooseAnswer(state, answer)
    assert.equal(state.streak, expectedStreaks[index])
    finishReaction(state)
  })

  assert.equal(state.phase, 'result')
  assert.equal(state.score, 51)
  assert.equal(state.hits, 4)
  assert.equal(state.bestStreak, 2)
})

test('answers outside a dialogue and invalid answer indexes leave game state unchanged', () => {
  const state = createInitialState()
  const assertRejected = (answer) => {
    const before = structuredClone(state)
    assert.equal(chooseAnswer(state, answer), false)
    assert.deepEqual(state, before)
  }

  assertRejected(0)
  startGame(state)
  assertRejected(0)
  reachDialog(state)
  for (const answer of [-1, 3, 1.5, NaN, Infinity, '0', null, undefined]) {
    assertRejected(answer)
  }

  assert.equal(chooseAnswer(state, 0), true)
  assertRejected(0)
  assertRejected(1)
  assert.equal(state.score, 14)
  assert.equal(state.hits, 1)

  const completed = playRun(Array(8).fill(0))
  const before = structuredClone(completed)
  assert.equal(chooseAnswer(completed, 0), false)
  assert.deepEqual(completed, before)
})

test('manual dialogue waits for an answer and invalid clock ticks are ignored', () => {
  const state = createInitialState()
  startGame(state)
  const before = structuredClone(state)
  for (const delta of [0, -1, NaN, Infinity, undefined]) updateGame(state, delta)
  assert.deepEqual(state, before)

  reachDialog(state)
  updateGame(state, 60)
  assert.equal(state.phase, 'dialog')
  assert.equal(state.index, 0)
  assert.equal(state.score, 0)
  assert.equal(state.reaction, null)
})

test('replay resets scores, timers, feedback, progress, and mode', () => {
  const state = playRun(Array(8).fill(0))
  startGame(state, 'auto')
  assert.deepEqual(state, { ...createInitialState(), phase: 'approach', mode: 'auto' })

  reachDialog(state)
  chooseAnswer(state, 2)
  assert.equal(state.score, -8)
  assert.ok(state.reaction)
  assert.ok(state.toastRemaining > 0)
  startGame(state)
  assert.deepEqual(state, { ...createInitialState(), phase: 'approach' })
  reachDialog(state)
  assert.equal(chooseAnswer(state, 0), true)
  assert.equal(state.score, 14)
  assert.equal(state.hits, 1)
})

test('the demo gives time to read each question and reaction and finishes in approximately 50 seconds', () => {
  const state = createInitialState()
  startGame(state, 'auto')
  const visited = new Set()
  const readingFrames = Array.from({ length: encounters.length }, () => ({ dialog: 0, reaction: 0 }))
  let frames = 0
  while (state.phase !== 'result' && frames < 60 * 55) {
    visited.add(state.index)
    if (state.phase === 'dialog' || state.phase === 'reaction') readingFrames[state.index][state.phase] += 1
    updateGame(state, 1 / 60)
    frames += 1
  }

  assert.equal(state.phase, 'result')
  assert.deepEqual([...visited], [0, 1, 2, 3, 4, 5, 6, 7])
  assert.ok(frames / 60 >= 49 && frames / 60 <= 50, `demo took ${frames / 60} seconds`)
  for (const [index, reading] of readingFrames.entries()) {
    assert.ok(reading.dialog / 60 >= 3, `question ${index + 1} should stay visible for 3 seconds`)
    assert.ok(reading.reaction / 60 >= 2.5, `reaction ${index + 1} should stay visible for 2.5 seconds`)
  }
  assert.equal(state.score, 74)
  assert.equal(state.hits, 6)
  assert.equal(state.streak, 4)
  assert.equal(state.bestStreak, 4)
})

test('result tiers include their exact score boundaries', () => {
  for (const score of [-42, 0, 47]) assert.equal(getResult({ score }).title, 'HA NOI!')
  for (const score of [48, 74, 87]) assert.equal(getResult({ score }).title, 'NED SCHLECHT!')
  for (const score of [88, 114]) assert.equal(getResult({ score }).title, 'A ECHTS KÄPSELE!')
  assert.ok(getResult({ score: 114 }).description.length > 0)
})

test('share text contains the actual score and hits, and score signs remain readable', () => {
  assert.equal(
    createShareText({ score: 114, hits: 8 }),
    'GRÜSSLE! — Mein Schwaben-Respekt: 114 🥨 | 8/8 Volltreffer | SPATZVERSE · A bissle Ulm. A bissle Chaos.',
  )
  assert.match(createShareText({ score: -42, hits: 0 }), /-42 🥨 \| 0\/8 Volltreffer/)
  assert.equal(signedScore(14), '+14')
  assert.equal(signedScore(0), '+0')
  assert.equal(signedScore(-8), '-8')
})
