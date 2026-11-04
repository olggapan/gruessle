import { MUSIC_LEVEL, MUSIC_STEP_SECONDS, MUSIC_STEPS, musicNotesAt } from './musicScore.js'

// Frequency, duration, waveform, volume, and delay from the original prototype.
const sounds = {
  good: [
    [480, 0.13, 'triangle', 0.065, 0],
    [720, 0.18, 'triangle', 0.055, 0.095],
    [900, 0.23, 'triangle', 0.03, 0.18],
  ],
  bad: [
    [190, 0.18, 'sawtooth', 0.035, 0],
    [130, 0.28, 'sawtooth', 0.025, 0.17],
  ],
  tap: [[360, 0.045, 'triangle', 0.028, 0]],
  bird: [
    [900, 0.11, 'sine', 0.029, 0],
    [1150, 0.09, 'sine', 0.021, 0.14],
  ],
  step: [[115, 0.045, 'sine', 0.018, 0]],
}

export function createAudio() {
  let context = null
  let muted = false
  let disposed = false
  let resumePromise = null
  let paused = false
  let musicPlaying = false
  let musicBus = null
  let musicFilter = null
  let musicStep = 0
  let nextMusicTime = null
  let duckUntil = 0
  const voices = new Set()

  function getContext() {
    if (muted || paused || disposed) return null
    if (context) return context.state === 'closed' ? null : context

    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext
    if (!AudioContext) return null

    try {
      context = new AudioContext()
      return context
    } catch {
      return null
    }
  }

  async function unlock() {
    const audio = getContext()
    if (!audio) return false

    try {
      if (audio.state === 'suspended') {
        // Share pending resume requests, including browsers awaiting a user gesture.
        if (!resumePromise) {
          resumePromise = Promise.resolve(audio.resume()).finally(() => {
            resumePromise = null
          })
        }
        await resumePromise
      }
      return !disposed && !muted && !paused && audio.state === 'running'
    } catch {
      return false
    }
  }

  function releaseVoice(voice, stop = false) {
    voice.oscillator.onended = null
    if (stop) {
      try {
        voice.oscillator.stop()
      } catch {
        // The oscillator may already have ended.
      }
    }
    voice.oscillator.disconnect()
    voice.gain.disconnect()
    voices.delete(voice)
  }

  function tone(audio, [frequency, duration, waveform, volume, delay], destination = audio.destination, when = audio.currentTime, music = false) {
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    const voice = { oscillator, gain, music }
    voices.add(voice)
    oscillator.onended = () => releaseVoice(voice)

    try {
      const start = when + delay
      oscillator.type = waveform
      oscillator.frequency.setValueAtTime(frequency, start)
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(volume, start + 0.013)
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
      oscillator.connect(gain)
      gain.connect(destination)
      oscillator.start(start)
      oscillator.stop(start + duration + 0.02)
    } catch {
      releaseVoice(voice, true)
    }
  }

  function play(kind) {
    const notes = sounds[kind]
    if (!notes) return
    const audio = getContext()
    if (!audio) return
    void unlock()
    duckMusic(audio, Math.max(...notes.map((note) => note[1] + note[4])) + 0.06)
    for (const note of notes) tone(audio, note)
  }

  function getMusicBus(audio) {
    if (musicBus) return musicBus
    musicBus = audio.createGain()
    musicBus.gain.setValueAtTime(MUSIC_LEVEL, audio.currentTime)
    musicFilter = audio.createBiquadFilter()
    musicFilter.type = 'lowpass'
    musicFilter.frequency.setValueAtTime(950, audio.currentTime)
    musicFilter.Q.setValueAtTime(0.5, audio.currentTime)
    musicBus.connect(musicFilter)
    musicFilter.connect(audio.destination)
    return musicBus
  }

  function duckMusic(audio, duration) {
    if (!musicPlaying) return
    const gain = getMusicBus(audio).gain
    const now = audio.currentTime
    duckUntil = Math.max(duckUntil, now + duration)
    // Hold the current envelope when effects overlap, then stay quiet until
    // the last effect finishes. Effects themselves retain their original mix.
    if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now)
    else {
      const current = gain.value
      gain.cancelScheduledValues(now)
      gain.setValueAtTime(current, now)
    }
    gain.linearRampToValueAtTime(MUSIC_LEVEL * 0.22, now + 0.012)
    gain.setValueAtTime(MUSIC_LEVEL * 0.22, duckUntil)
    gain.linearRampToValueAtTime(MUSIC_LEVEL, duckUntil + 0.28)
  }

  // Called by the game's frame loop; Web Audio supplies precise note timing.
  // A short lookahead avoids a second timer and never catches up missed bars.
  function updateMusic() {
    if (!musicPlaying || muted || paused || disposed || context?.state !== 'running') return
    const now = context.currentTime
    if (nextMusicTime === null || nextMusicTime < now) nextMusicTime = now + 0.025
    const bus = getMusicBus(context)
    while (nextMusicTime < now + 0.15) {
      for (const note of musicNotesAt(musicStep)) tone(context, note, bus, nextMusicTime, true)
      musicStep = (musicStep + 1) % MUSIC_STEPS
      nextMusicTime += MUSIC_STEP_SECONDS
    }
  }

  function stopVoices(musicOnly = false) {
    for (const voice of voices) {
      if (!musicOnly || voice.music) releaseVoice(voice, true)
    }
    nextMusicTime = null
  }

  function setMusicPlaying(value) {
    musicPlaying = Boolean(value)
    stopVoices(true)
    musicStep = 0
    duckUntil = 0
    if (musicBus && context) {
      musicBus.gain.cancelScheduledValues(context.currentTime)
      musicBus.gain.setValueAtTime(MUSIC_LEVEL, context.currentTime)
    }
  }

  function setPaused(value) {
    paused = Boolean(value)
    if (paused) stopVoices()
    else if (musicPlaying) void unlock()
  }

  function setMuted(value) {
    muted = Boolean(value)
    if (muted) stopVoices()
    else if (musicPlaying) void unlock()
  }

  async function dispose() {
    if (disposed) return
    disposed = true
    stopVoices()
    musicBus?.disconnect()
    musicFilter?.disconnect()
    const audio = context
    context = null
    if (!audio || audio.state === 'closed') return

    try {
      await audio.close()
    } catch {
      // Closing an unavailable audio device must not interrupt component cleanup.
    }
  }

  return { unlock, play, setMuted, setPaused, setMusicPlaying, updateMusic, dispose }
}
