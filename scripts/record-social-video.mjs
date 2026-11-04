// Record the real app through pointer input; no changes to gameplay or scoring.
// PLAYWRIGHT_MODULE may point to a shared Playwright installation.
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const output = path.resolve('artifacts/social-video')
const server = await createServer({ server: { host: '127.0.0.1', port: 5188, strictPort: true } })
await server.listen()
await mkdir(path.join(output, 'frames'), { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling'],
})
const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', error => errors.push(error.message))

// Fork the game's actual Web Audio output into a recorder, preserving all notes,
// envelopes and timing. Record silence too so audio and video share one timeline.
await page.addInitScript(() => {
  const NativeAudioContext = window.AudioContext
  const context = new NativeAudioContext({ sampleRate: 48000 })
  const destination = context.createMediaStreamDestination()
  // Keep the recording clock alive during silence; otherwise Chromium omits
  // leading silence and can leave timestamp gaps between the short effects.
  const silentClock = context.createConstantSource()
  silentClock.offset.value = 0
  silentClock.connect(destination)
  silentClock.start()
  const originalConnect = AudioNode.prototype.connect
  AudioNode.prototype.connect = function (...args) {
    const result = originalConnect.apply(this, args)
    if (args[0] === context.destination) originalConnect.call(this, destination)
    return result
  }
  window.AudioContext = class { constructor() { return context } }
  const chunks = []
  const recorder = new MediaRecorder(destination.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 })
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
  window.recording = {
    async start() {
      await context.resume()
      this.started = performance.timeOrigin + performance.now()
      recorder.start(1000)
      return this.started
    },
    async stop() {
      const stopped = new Promise(resolve => { recorder.onstop = resolve })
      recorder.stop()
      await stopped
      const data = await new Blob(chunks).arrayBuffer()
      let binary = ''
      for (const byte of new Uint8Array(data)) binary += String.fromCharCode(byte)
      return btoa(binary)
    },
  }
})

await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5188/', { waitUntil: 'networkidle' })
await page.locator('.hero-title').waitFor()
await page.screenshot({ path: path.join(output, 'opening.png') })
if (process.argv.includes('--probe')) {
  const cdp = await page.context().newCDPSession(page)
  const frame = new Promise(resolve => cdp.once('Page.screencastFrame', resolve))
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1080, maxHeight: 1920 })
  const result = await frame
  await writeFile(path.join(output, 'probe.jpg'), Buffer.from(result.data, 'base64'))
  console.log(JSON.stringify(result.metadata))
  await browser.close()
  await server.close()
  process.exit(0)
}

const cdp = await page.context().newCDPSession(page)
const frames = []
const writes = []
let lastTime = 0
cdp.on('Page.screencastFrame', frame => {
  void cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => {})
  const timestamp = frame.metadata.timestamp
  if (timestamp - lastTime < 1 / 32) return
  lastTime = timestamp
  const filename = `frames/${String(frames.length).padStart(6, '0')}.jpg`
  frames.push({ filename, timestamp })
  writes.push(writeFile(path.join(output, filename), Buffer.from(frame.data, 'base64')))
})
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 2 })
const start = await page.evaluate(() => window.recording.start()) / 1000
const events = []
const mark = async (name) => {
  const timestamp = await page.evaluate(() => (performance.timeOrigin + performance.now()) / 1000)
  events.push({ name, seconds: timestamp - start })
  console.log(`${(timestamp - start).toFixed(2)}s ${name}`)
}
await mark('Opening — 10 seconds to read')
await page.waitForTimeout(10000)
await page.locator('.overlay .cta').first().click()
await page.mouse.move(520, 450)
await mark('Start manual play')
const answers = [0, 1, 0, 1, 0, 0, 0, 0]
for (let i = 0; i < answers.length; i++) {
  await page.locator('.interaction .speaker').filter({ hasText: `BEGEGNUNG ${i + 1}/8` }).waitFor()
  await mark(`Encounter ${i + 1}`)
  // Leave all answers neutral while viewers read them.
  await page.evaluate(() => document.activeElement?.blur())
  await page.waitForTimeout(3000)
  const choice = page.locator('.choice').nth(answers[i])
  await choice.hover()
  await page.waitForTimeout(900)
  await mark(`Select answer ${answers[i] + 1}`)
  await choice.click()
  await page.mouse.move(520, 450)
}
await page.locator('.result').waitFor()
await page.evaluate(() => document.activeElement?.blur())
const score = await page.locator('.result-score').innerText()
if (score !== '+74') throw new Error(`Unexpected score: ${score}`)
await mark('Result +74 — 8 seconds to read')
await page.screenshot({ path: path.join(output, 'result.png') })
await page.waitForTimeout(8000)
const end = await page.evaluate(() => (performance.timeOrigin + performance.now()) / 1000)
const audio = await page.evaluate(() => window.recording.stop())
await cdp.send('Page.stopScreencast')
await Promise.all(writes)
await writeFile(path.join(output, 'audio.webm'), Buffer.from(audio, 'base64'))
await writeFile(path.join(output, 'recording.json'), JSON.stringify({ start, end, duration: end - start, score, events, frames, errors }, null, 2))
await browser.close()
await server.close()
console.log(JSON.stringify({ duration: end - start, frames: frames.length, score, errors }))
