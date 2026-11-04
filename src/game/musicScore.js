// Original “A bissle Ulm”: a relaxed 16-bar, 3/4 walking tune in C major.
// Six eighth-note slots per bar; rests leave space for reading and birdsong.
export const MUSIC_STEP_SECONDS = 60 / 92 / 2
export const MUSIC_STEPS = 16 * 6
export const MUSIC_LEVEL = 8

const bars = [
  [48, [55, 60, 64], [64, 67, 69, 67, 64, 0]],
  [43, [55, 59, 62], [62, 0, 67, 65, 62, 0]],
  [45, [57, 60, 64], [60, 64, 67, 64, 60, 0]],
  [41, [53, 57, 60], [65, 0, 64, 62, 60, 0]],
  [48, [55, 60, 64], [64, 67, 69, 67, 64, 0]],
  [41, [53, 57, 60], [65, 69, 67, 65, 64, 0]],
  [43, [55, 59, 62], [62, 64, 65, 0, 59, 62]],
  [48, [55, 60, 64], [60, 0, 0, 0, 0, 0]],
  [45, [57, 60, 64], [69, 0, 67, 64, 60, 64]],
  [40, [55, 59, 64], [67, 0, 64, 62, 59, 0]],
  [41, [53, 57, 60], [65, 69, 67, 65, 60, 0]],
  [48, [55, 60, 64], [64, 0, 67, 64, 60, 0]],
  [38, [53, 57, 62], [62, 65, 69, 0, 65, 62]],
  [43, [55, 59, 62], [67, 0, 65, 62, 59, 0]],
  [48, [55, 60, 64], [64, 67, 64, 62, 60, 0]],
  [43, [55, 59, 62], [59, 0, 62, 0, 0, 0]],
]

const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12)

export function musicNotesAt(step) {
  const [bass, chord, melody] = bars[Math.floor(step / 6) % bars.length]
  const slot = step % 6
  const notes = []
  // Rounded bass and short off-beat chords suggest a small folk ensemble,
  // without percussion or bright harmonics competing with feedback effects.
  if (slot === 0) notes.push([frequency(bass), 0.46, 'sine', 0.024, 0])
  if (slot === 2 || slot === 4) {
    for (const note of chord) notes.push([frequency(note), 0.22, 'sine', 0.006, 0])
  }
  if (melody[slot]) notes.push([frequency(melody[slot]), 0.25, 'triangle', 0.022, 0])
  return notes
}
