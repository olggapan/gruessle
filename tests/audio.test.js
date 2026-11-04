import test from 'node:test'
import assert from 'node:assert/strict'
import { createAudio } from '../src/game/createAudio.js'
import { MUSIC_LEVEL, MUSIC_STEP_SECONDS, MUSIC_STEPS, musicNotesAt } from '../src/game/musicScore.js'

function fixture(t) {
  const parameter = () => ({
    value: 0, events: [],
    setValueAtTime(value, time) { this.value = value; this.events.push(['set', value, time]) },
    linearRampToValueAtTime(value, time) { this.events.push(['ramp', value, time]) },
    exponentialRampToValueAtTime(value, time) { this.events.push(['exp', value, time]) },
    cancelScheduledValues(time) { this.events.push(['cancel', time]) },
    cancelAndHoldAtTime(time) { this.events.push(['hold', time]) },
  })
  const node = () => ({
    connections: [], disconnected: false,
    connect(target) { this.connections.push(target) },
    disconnect() { this.disconnected = true },
  })
  const context = {
    currentTime: 0, state: 'running', destination: {}, oscillators: [], gains: [], filters: [],
    createOscillator() {
      const oscillator = { ...node(), frequency: parameter(), stops: [],
        start(time) { this.startTime = time }, stop(time) { this.stops.push(time) } }
      this.oscillators.push(oscillator)
      return oscillator
    },
    createGain() { const gain = { ...node(), gain: parameter() }; this.gains.push(gain); return gain },
    createBiquadFilter() {
      const filter = { ...node(), frequency: parameter(), Q: parameter() }
      this.filters.push(filter)
      return filter
    },
    async resume() { this.state = 'running' },
    async close() { this.state = 'closed' },
  }
  t.mock.method(globalThis, 'AudioContext', function () { return context })
  const audio = createAudio()
  t.after(() => audio.dispose())
  return { audio, context }
}

// Node has no Web Audio; install a configurable constructor for scoped mocking.
globalThis.AudioContext = function () { throw new Error('No audio device') }

test('music stays silent before unlock, repeats at a steady tempo, and does not stack on replay', async (t) => {
  const { audio, context } = fixture(t)
  audio.setMusicPlaying(true)
  audio.updateMusic()
  assert.equal(context.oscillators.length, 0)
  await audio.unlock()
  for (let frame = 0; frame < 64 * 60; frame++) {
    context.currentTime = frame / 60
    audio.updateMusic()
  }
  const starts = [...new Set(context.oscillators.map((voice) => voice.startTime))]
  const expected = []
  for (let step = 0; step * MUSIC_STEP_SECONDS < 64; step++) {
    if (musicNotesAt(step).length) expected.push(0.025 + step * MUSIC_STEP_SECONDS)
  }
  for (let i = 0; i < expected.length; i++) assert.ok(Math.abs(starts[i] - expected[i]) < 1e-8)
  const previousVoices = [...context.oscillators]
  audio.setMusicPlaying(true)
  assert.ok(previousVoices.every((voice) => voice.disconnected))
  audio.updateMusic()
  assert.equal(context.oscillators.at(-1).frequency.value, musicNotesAt(0).at(-1)[0])
})

test('effects bypass the quiet music bus and overlapping effects extend ducking', async (t) => {
  const { audio, context } = fixture(t)
  await audio.unlock()
  audio.setMusicPlaying(true)
  audio.updateMusic()
  const bus = context.gains[0]
  assert.equal(bus.gain.value, MUSIC_LEVEL)
  assert.equal(context.filters[0].frequency.value, 950)
  audio.play('bad')
  assert.ok(context.gains.slice(-2).every((gain) => gain.connections[0] === context.destination))
  assert.deepEqual(context.oscillators.slice(-2).map((voice) => voice.frequency.value), [190, 130])
  context.currentTime = 0.1
  audio.play('tap')
  const envelope = bus.gain.events.slice(-4)
  assert.deepEqual(envelope[0], ['hold', 0.1])
  assert.ok(Math.abs(envelope[2][2] - 0.51) < 1e-8, 'shorter overlapping tap must not end ducking early')
  assert.equal(envelope[2][1], MUSIC_LEVEL * 0.22)
  assert.ok(Math.abs(envelope[3][2] - 0.79) < 1e-8)
  for (let step = 0; step < MUSIC_STEPS; step++) {
    const duckedPeakBound = musicNotesAt(step).reduce((sum, note) => sum + note[3], 0) * MUSIC_LEVEL * 0.22
    assert.ok(duckedPeakBound < 0.018 / 2, 'ducked music peaks stay below half the quietest effect peak')
  }
})

test('mute and background pause stop every voice and resume without a catch-up burst', async (t) => {
  const { audio, context } = fixture(t)
  await audio.unlock()
  audio.setMusicPlaying(true)
  for (const setter of [audio.setMuted, audio.setPaused]) {
    audio.updateMusic()
    audio.play('bird')
    setter(true)
    assert.ok(context.oscillators.every((voice) => voice.disconnected))
    const count = context.oscillators.length
    context.currentTime += 120
    audio.updateMusic()
    audio.play('good')
    assert.equal(context.oscillators.length, count)
    setter(false)
    audio.updateMusic()
    assert.ok(context.oscillators.length > count)
    assert.ok(context.oscillators.length - count <= 4)
    assert.ok(context.oscillators.at(-1).startTime > context.currentTime)
  }
})

test('ending music preserves the result effect and dispose disconnects everything', async (t) => {
  const { audio, context } = fixture(t)
  await audio.unlock()
  audio.setMusicPlaying(true)
  audio.updateMusic()
  audio.play('good')
  audio.setMusicPlaying(false)
  assert.ok(context.oscillators.slice(-3).every((voice) => !voice.disconnected))
  const count = context.oscillators.length
  audio.updateMusic()
  assert.equal(context.oscillators.length, count)
  await audio.dispose()
  assert.equal(context.state, 'closed')
  assert.ok([...context.oscillators, ...context.gains, ...context.filters].every((node) => node.disconnected))
  assert.equal(await audio.unlock(), false)
  audio.play('bird')
  audio.updateMusic()
  assert.equal(context.oscillators.length, count)
})

test('an unavailable audio device leaves music and effects harmless', async () => {
  const audio = createAudio()
  audio.setMusicPlaying(true)
  assert.equal(await audio.unlock(), false)
  audio.play('good')
  audio.updateMusic()
  await audio.dispose()
})
