const WIDTH = 540
const HEIGHT = 960
const randomBetween = (min, max) => min + Math.random() * (max - min)

/** Draw the prototype's procedural world without owning an animation loop. */
export function createWorldRenderer(canvas, encounters, locations) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser does not support the 2D canvas renderer.')

  canvas.width = WIDTH
  canvas.height = HEIGHT
  let particles = []
  let disposed = false

  function roundedRect(x, y, width, height, radius, fill) {
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
    ctx.fill()
  }

  function polygon(points, color) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(...points[0])
    points.slice(1).forEach((point) => ctx.lineTo(...point))
    ctx.closePath()
    ctx.fill()
  }

  function line(x1, y1, x2, y2, color, width = 2) {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  function circle(x, y, radius, color) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, Math.max(0.1, radius), 0, Math.PI * 2)
    ctx.fill()
  }

  function windowPane(x, y, width, height) {
    roundedRect(x, y, width, height, 2, '#31585c')
    roundedRect(x + 3, y + 3, width - 6, height - 6, 1, '#b0dbcc')
    line(x + width / 2, y, x + width / 2, y + height, '#426e6b', 2)
    line(x, y + height / 2, x + width, y + height / 2, '#426e6b', 2)
  }

  function house(x, y, width, height, colors, roof = true, timber = false) {
    roundedRect(x, y, width, height, 3, colors[0])
    if (roof) {
      polygon([[x - 9, y], [x + width / 2, y - height * 0.36], [x + width + 9, y]], colors[1])
    }
    if (timber) {
      line(x + 6, y + 5, x + width - 6, y + height - 7, colors[1], 6)
      line(x + width - 6, y + 5, x + 6, y + height - 7, colors[1], 6)
      for (let row = 0.28; row < 1; row += 0.28) {
        line(x, y + height * row, x + width, y + height * row, colors[1], 5)
      }
    }
    const windowWidth = width / 6
    const windowHeight = height / 3.5
    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < 2; column++) {
        windowPane(
          x + width * 0.19 + column * width * 0.43,
          y + height * 0.2 + row * height * 0.35,
          windowWidth,
          windowHeight * 0.8,
        )
      }
    }
  }

  function minster(x, y, scale) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    roundedRect(-58, -3, 116, 148, 0, '#d7c3ae')
    roundedRect(-24, -80, 48, 80, 0, '#c8b4a0')
    for (let level = 0; level < 4; level++) {
      const width = 43 - level * 8
      const top = -80 - level * 42
      roundedRect(-width / 2, top - 42, width, 42, 0, level % 2 ? '#c7b19f' : '#dcc4ab')
      for (let column = 0; column < 3; column++) {
        const left = -width / 2 + 5 + column * (width - 10) / 3
        roundedRect(left, top - 36, 4, 19, 1, '#6b8581')
      }
    }
    polygon([[-9, -245], [0, -312], [9, -245]], '#a6a196')
    line(0, -310, 0, -330, '#748280', 3)
    line(-12, -324, 12, -324, '#748280', 3)
    for (let column = 0; column < 4; column++) {
      roundedRect(-46 + column * 30, -17, 16, 47, 8, '#718c89')
    }
    ctx.restore()
  }

  function sparrow(x, y, scale) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    circle(0, 4, 20, '#8b6651')
    circle(11, -13, 14, '#a88362')
    polygon([[20, -15], [36, -10], [20, -5]], '#e8b65c')
    circle(16, -17, 2.8, '#202c2b')
    polygon([[-6, 5], [-24, -6], [-17, 17]], '#684b42')
    line(-4, 23, -8, 31, '#d99e64', 3)
    line(8, 22, 12, 30, '#d99e64', 3)
    ctx.restore()
  }

  function resident(x, baseline, scale, personIndex, walk) {
    const person = encounters[personIndex]
    const leg = Math.sin(walk) * 10
    ctx.save()
    ctx.translate(x, baseline)
    ctx.scale(scale, scale)
    ctx.globalAlpha = 0.15
    ctx.fillStyle = '#193a3b'
    ctx.beginPath()
    ctx.ellipse(0, 0, 31, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    if (person.archetype === 'bird') {
      sparrow(0, -50, 1.25)
      ctx.restore()
      return
    }

    line(-9, -30, -11 + leg, -4, '#2e4347', 9)
    line(9, -30, 11 - leg, -4, '#374d53', 9)
    roundedRect(-18, -92, 36, 64, 11, person.accent)
    roundedRect(-17, -85, 34, 18, 7, '#ffffff35')
    line(-18, -79, -26 + leg / 2, -45, '#bc9075', 9)
    line(18, -79, 26 - leg / 2, -45, '#bc9075', 9)
    circle(0, -110, 18, '#e2b69a')
    roundedRect(-17, -126, 34, 10, 6, person.archetype === 'senior' ? '#ddd8d0' : '#4d4b44')
    if (person.archetype === 'tourist') {
      roundedRect(-13, -126, 25, 8, 5, '#e5e6ac')
      roundedRect(-9, -73, 18, 20, 4, '#cda95f')
    }
    if (person.archetype === 'broom') {
      line(26, -44, 32, -8, '#836349', 5)
      roundedRect(22, -8, 21, 10, 2, '#b08e54')
    }
    if (person.archetype === 'guard') {
      roundedRect(-24, -102, 48, 15, 5, '#2d5065')
      circle(0, -134, 22, '#4b5f62')
    }
    if (person.archetype === 'vendor') {
      roundedRect(-24, -120, 48, 13, 3, '#e9e0a0')
    }
    circle(-7, -110, 2.1, '#27363b')
    circle(7, -110, 2.1, '#27363b')
    ctx.restore()
  }

  function drawPlayer(phase, travel) {
    const bob = phase === 'approach' ? Math.sin(travel * 11) * 4 : 0
    const leg = Math.sin(travel * 11) * 9
    const leftAnkleX = -13 + leg
    const rightAnkleX = 11 - leg
    ctx.save()
    ctx.translate(268, 885 + bob)
    ctx.scale(1.22, 1.22)
    ctx.globalAlpha = 0.28
    ctx.fillStyle = '#1a393c'
    ctx.beginPath()
    ctx.ellipse(0, 3, 41, 13, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    line(-12, -41, leftAnkleX, 4, '#244b58', 15)
    line(11, -41, rightAnkleX, 4, '#244b58', 15)
    // Keep each shoe attached to its ankle throughout the walking cycle.
    line(leftAnkleX - 10, 4, leftAnkleX + 1, 4, '#243439', 10)
    line(rightAnkleX - 1, 4, rightAnkleX + 10, 4, '#26383d', 10)
    roundedRect(-27, -123, 53, 86, 14, '#56765a')
    line(-24, -103, -33 - leg / 3, -56, '#dfb29c', 13)
    line(22, -103, 34 + leg / 3, -56, '#dfb29c', 13)
    roundedRect(-27, -122, 55, 61, 10, '#314c42')
    roundedRect(-20, -118, 39, 52, 8, '#b88357')
    roundedRect(-14, -104, 27, 20, 4, '#966d50')
    circle(0, -146, 24, '#d4ab91')
    roundedRect(-24, -163, 48, 15, 8, '#38383a')
    ctx.restore()
  }

  function render({ phase = 'menu', index = 0, time = 0, ambient = 0, approach = 0, deltaTime = 0 } = {}) {
    if (disposed) return
    const scene = encounters[Math.min(index, encounters.length - 1)]?.place ?? 0
    const location = locations[scene]
    const travel = phase === 'approach' ? time : ambient
    const gradient = ctx.createLinearGradient(0, 0, 0, 650)
    gradient.addColorStop(0, location.sky[0])
    gradient.addColorStop(1, location.sky[1])
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    for (let cloud = 0; cloud < 4; cloud++) {
      const x = 60 + cloud * 146 + Math.sin(travel * 0.13 + cloud) * 13
      roundedRect(x, 127 + cloud % 2 * 29, 93, 14, 9, '#ecf7de7d')
      circle(x + 15, 133 + cloud % 2 * 29, 20, '#ecf7de8d')
      circle(x + 55, 129 + cloud % 2 * 29, 26, '#ecf7de88')
    }
    polygon([[0, 435], [60, 390], [156, 412], [235, 389], [340, 415], [445, 380], [540, 412], [540, 550], [0, 550]], '#739fa17c')

    if (scene === 0) {
      minster(368, 462, 1.03)
      house(0, 340, 110, 205, ['#eedfc6', '#a75d51'], true, true)
      house(100, 410, 109, 128, ['#e7d9bf', '#b07961'])
      house(438, 395, 124, 158, ['#f3e0bd', '#905d53'], true, true)
      house(360, 465, 84, 98, ['#e2d9c7', '#b07561'])
    }
    if (scene === 1) {
      house(-32, 288, 176, 292, ['#f1e0be', '#915e52'], true, true)
      house(105, 392, 122, 169, ['#e2ddc6', '#a56d5b'], true, true)
      house(419, 340, 150, 280, ['#f4edd5', '#b4765c'], true, true)
      roundedRect(0, 553, 540, 50, 0, '#7bc6c1')
      for (let ripple = 0; ripple < 16; ripple++) {
        line(ripple * 40, 575 + Math.sin(ripple) * 4, ripple * 40 + 21, 575 + Math.sin(ripple) * 4, '#d9f5df77', 2)
      }
    }
    if (scene === 2) {
      roundedRect(0, 500, 540, 460, 0, '#5cb7be')
      for (let ripple = 0; ripple < 38; ripple++) {
        const x = (ripple * 83 + Math.floor(travel * 4) * 3) % 580 - 20
        const y = 530 + (ripple * 51) % 350
        line(x, y, x + 24, y, '#c4e6de44', 3)
      }
      house(4, 411, 135, 135, ['#f1e0c5', '#985958'])
      house(445, 420, 135, 125, ['#eed8b8', '#a36a57'])
      roundedRect(0, 548, 540, 24, 1, '#708487')
      for (let railing = 0; railing < 13; railing++) {
        line(railing * 49, 546, railing * 49, 578, '#526e72', 6)
      }
    }

    polygon([[0, 540], [540, 540], [540, 960], [0, 960]], scene === 2 ? '#6b9da0' : location.ground)
    polygon([[205, 530], [335, 530], [545, 960], [-5, 960]], location.path)
    polygon([[201, 530], [208, 530], [1, 960], [-10, 960]], '#ebe2c0')
    polygon([[332, 530], [340, 530], [550, 960], [538, 960]], '#eee6ca')
    for (let stripe = 0; stripe < 12; stripe++) {
      const depth = (stripe / 12 + travel * 0.26) % 1
      const y = 538 + depth * depth * 470
      const width = 3 + depth * 24
      line(270 - width / 2, y, 270 + width / 2, y, '#e5e1cf81', 1 + depth * 3)
    }
    if (scene === 0) {
      for (let shrub = 0; shrub < 5; shrub++) {
        const depth = (shrub / 5 + travel * 0.08) % 1
        const y = 535 + depth * depth * 480
        const x = 155 - depth * 160
        circle(x, y, 8 + depth * 10, '#6a8c61')
        circle(WIDTH - x, y, 8 + depth * 10, '#7c9e6c')
      }
    }
    if (scene === 1) {
      for (let stone = 0; stone < 5; stone++) {
        const depth = (stone / 5 + travel * 0.05) % 1
        circle(169 - depth * 115, 535 + depth * depth * 450, 4 + depth * 7, '#80978c')
      }
    }
    if (phase !== 'menu' && phase !== 'result') {
      const progress = phase === 'approach' ? approach : 1
      const baseline = 555 + 370 * progress * progress
      const scale = 0.23 + 1.6 * progress
      const personIndex = Math.min(index, encounters.length - 1)
      resident(270 + Math.sin(time * 1.6) * 26 * (1 - progress), baseline, scale, personIndex, time * 10)
    }

    drawPlayer(phase, travel)
    if (scene !== 2) {
      sparrow(99 + Math.sin(travel * 0.4) * 15, 262 + Math.cos(travel * 0.5) * 11, 0.35)
    }

    const elapsed = Math.max(0, deltaTime)
    for (const particle of particles) {
      circle(particle.x, particle.y, particle.radius, particle.color)
      particle.y -= particle.speed * elapsed
      particle.life -= elapsed
    }
    particles = particles.filter((particle) => particle.life > 0)
  }

  function addFeedbackParticles(good) {
    if (disposed) return
    for (let index = 0; index < 18; index++) {
      particles.push({
        x: randomBetween(160, 380),
        y: randomBetween(380, 610),
        radius: randomBetween(2, 6),
        speed: randomBetween(60, 240),
        life: 1,
        color: good ? '#e7fb92' : '#ffc08f',
      })
    }
  }

  function reset() {
    particles = []
  }

  function dispose() {
    if (disposed) return
    reset()
    ctx.clearRect(0, 0, WIDTH, HEIGHT)
    disposed = true
  }

  return { render, addFeedbackParticles, reset, dispose }
}
