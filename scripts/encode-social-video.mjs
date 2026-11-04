import { readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const output = path.resolve('artifacts/social-video')
const recording = JSON.parse(await readFile(path.join(output, 'recording.json'), 'utf8'))
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg'
const opening = 10
const resultTime = recording.events.find(event => event.name.startsWith('Result +74')).seconds
const sourceDuration = Math.min(recording.duration, resultTime + 8)
// Remove capture overhead from the active play, retaining readable questions,
// unchanged opening/result holds and the original pitch of all sound effects.
const readingTimes = recording.events.flatMap((event, index, events) => event.name.startsWith('Encounter ')
  ? [events[index + 1].seconds - event.seconds] : [])
const speed = 1
const retime = seconds => seconds <= opening ? seconds
  : seconds <= resultTime ? opening + (seconds - opening) / speed
    : opening + (resultTime - opening) / speed + seconds - resultTime
const duration = retime(sourceDuration)
const usable = recording.frames.filter(frame => frame.timestamp < recording.start + sourceDuration)
let first = usable.findLastIndex(frame => frame.timestamp <= recording.start)
if (first < 0) first = 0
const frames = usable.slice(first)
const lines = ['ffconcat version 1.0']
for (let i = 0; i < frames.length; i++) {
  const start = i === 0 ? 0 : frames[i].timestamp - recording.start
  const end = frames[i + 1] ? frames[i + 1].timestamp - recording.start : sourceDuration
  lines.push(`file '${frames[i].filename}'`, 'option framerate 1000', `duration ${(retime(end) - retime(start)).toFixed(6)}`)
}
lines.push(`file '${frames.at(-1).filename}'`, 'option framerate 1000')
await writeFile(path.join(output, 'frames.ffconcat'), lines.join('\n') + '\n')
const analysis = spawnSync(ffmpeg, ['-hide_banner', '-i', path.join(output, 'audio.webm'), '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' })
const peak = Number(analysis.stderr.match(/max_volume: (-?[\d.]+) dB/)?.[1])
if (!Number.isFinite(peak) || peak < -60) throw new Error(`Missing game audio: ${analysis.stderr}`)
const gain = Math.min(18, -2 - peak)
console.log(`Original audio peak: ${peak} dBFS; export gain: ${gain} dB`)
const audioFilter = `[1:a]aresample=async=1:first_pts=0,asplit=3[a0][a1][a2];` +
  `[a0]atrim=0:${opening},asetpts=PTS-STARTPTS[b0];` +
  `[a1]atrim=${opening}:${resultTime},asetpts=PTS-STARTPTS,atempo=${speed}[b1];` +
  `[a2]atrim=${resultTime}:${sourceDuration},asetpts=PTS-STARTPTS[b2];` +
  `[b0][b1][b2]concat=n=3:v=0:a=1,volume=${gain}dB,apad[audio]`
const result = spawnSync(ffmpeg, [
  '-hide_banner', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(output, 'frames.ffconcat'),
  '-i', path.join(output, 'audio.webm'), '-t', duration.toFixed(6),
  '-filter_complex', audioFilter, '-map', '0:v', '-map', '[audio]',
  '-vf', 'fps=30,scale=1080:1920:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
  '-movflags', '+faststart', '-metadata', 'title=GRÜSSLE! — 74 Punkte',
  path.join(output, 'gruessle-74-points-vertical.mp4'),
], { stdio: 'inherit' })
if (result.status !== 0) process.exit(result.status || 1)
await writeFile(path.join(output, 'export-info.json'), JSON.stringify({
  width: 1080, height: 1920, fps: 30, duration, gameplaySpeed: speed,
  score: recording.score, hits: 6, encounters: 8,
  openingHold: 10, resultHold: 8, audioGainDb: gain,
  events: recording.events.map(event => ({ ...event, seconds: retime(event.seconds) })),
}, null, 2))
