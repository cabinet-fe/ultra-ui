import type { AiOrbStatus } from '../../types/ai-orb'

/** 各生命状态的动画参数（数值均为无量纲，随尺寸缩放） */
interface OrbParams {
  /** 弹跳频率（Hz） */
  bounceFreq: number
  /** 弹跳幅度（相对球半径） */
  bounceAmp: number
  /** 落地挤压强度（0-1） */
  squash: number
  /** 表面摆动幅度（相对球半径） */
  wobbleAmp: number
  /** 表面摆动速度 */
  wobbleSpeed: number
  /** 呼吸缩振幅（相对球半径） */
  breathe: number
}

const STATUS_PARAMS: Record<AiOrbStatus, OrbParams> = {
  idle: {
    bounceFreq: 0.55,
    bounceAmp: 0.14,
    squash: 0.1,
    wobbleAmp: 0.02,
    wobbleSpeed: 1.1,
    breathe: 0.025
  },
  thinking: {
    bounceFreq: 2.1,
    bounceAmp: 0.5,
    squash: 0.22,
    wobbleAmp: 0.045,
    wobbleSpeed: 3.1,
    breathe: 0
  },
  speaking: {
    bounceFreq: 1.5,
    bounceAmp: 0.2,
    squash: 0.12,
    wobbleAmp: 0.034,
    wobbleSpeed: 2.3,
    breathe: 0.04
  }
}

const DEFAULT_COLOR = '#3d7fff'

interface HSL {
  h: number
  s: number
  l: number
}

/** 解析 #rgb / #rrggbb / rgb() 为 HSL；失败返回 null */
function parseColor(input: string): HSL | null {
  const text = input.trim()
  let r = 0
  let g = 0
  let b = 0

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text)
  if (hex) {
    const raw = hex[1]!
    const full =
      raw.length === 3
        ? raw
            .split('')
            .map((c) => c + c)
            .join('')
        : raw
    r = parseInt(full.slice(0, 2), 16)
    g = parseInt(full.slice(2, 4), 16)
    b = parseInt(full.slice(4, 6), 16)
  } else {
    const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(text)
    if (!rgb) return null
    r = Number(rgb[1])
    g = Number(rgb[2])
    b = Number(rgb[3])
  }

  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min

  let h = 0
  if (d !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6)
    else if (max === gn) h = 60 * ((bn - rn) / d + 2)
    else h = 60 * ((rn - gn) / d + 4)
  }
  if (h < 0) h += 360

  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))

  return { h, s: s * 100, l: l * 100 }
}

function hslCss(color: HSL, alpha = 1): string {
  return `hsla(${color.h.toFixed(1)}, ${color.s.toFixed(1)}%, ${color.l.toFixed(1)}%, ${alpha})`
}

function shiftLight(color: HSL, delta: number): HSL {
  return { ...color, l: Math.min(96, Math.max(8, color.l + delta)) }
}

export interface AiOrbRendererOptions {
  /** css 像素尺寸（画布为正方形） */
  size: number
  /** 基础色，自动派生高光 / 暗部 / 光晕；缺省取 DEFAULT_COLOR */
  color?: string
  status?: AiOrbStatus
}

export interface AiOrbRenderer {
  /** 目标状态切换（参数平滑过渡，无跳变） */
  setStatus(status: AiOrbStatus): void
  setColor(color: string): void
  resize(size: number): void
  start(): void
  stop(): void
  /** 绘制一帧静态画面（prefers-reduced-motion 降级用） */
  renderOnce(): void
  readonly running: boolean
}

/** 组合圆路径的点数（越大越平滑，36 在小尺寸下已足够） */
const SEGMENTS = 36

/** 高光 / 光晕渐变在单位球空间（R=1）中的定义，颜色确定后即可缓存复用 */
interface OrbGradients {
  base: CanvasGradient
  glow: CanvasGradient
  highlight: CanvasGradient
  /** 面部（眼睛 / 嘴）用色 */
  face: string
}

/**
 * 纯 canvas 2D 活体球渲染器（框架无关）。
 *
 * 性能设计：
 * - 单位球空间（R=1）绘制，渐变对象仅随颜色重建，与尺寸 / 每帧形变解耦
 * - 单条 36 段多边形路径 + 3 个径向渐变，无 shadowBlur、无滤镜
 * - rAF 循环由组件侧按可见性启停；dt 截断避免后台切回时的跳变
 */
export function createOrbRenderer(
  canvas: HTMLCanvasElement,
  options: AiOrbRendererOptions
): AiOrbRenderer {
  const ctx = canvas.getContext('2d')

  let size = options.size
  let dpr = 1
  let base: HSL = (options.color && parseColor(options.color)) || parseColor(DEFAULT_COLOR)!
  let gradients: OrbGradients | null = null

  let target: OrbParams = { ...STATUS_PARAMS[options.status ?? 'idle'] }
  let current: OrbParams = { ...target }
  let statusLabel: AiOrbStatus = options.status ?? 'idle'

  let rafId = 0
  let isRunning = false
  /** 动画时间（秒），只随 rAF 累积，暂停恢复无跳变 */
  let t = 0
  let lastFrameAt = 0
  /** 上一帧距当前的间隔（秒），截断防止后台切回时暴冲 */
  let frameDt = 1 / 60
  /** 下一次眨眼时间点（秒，随机间隔 2.2s - 5.2s） */
  let nextBlinkAt = 2 + Math.random() * 3
  /** 眨眼起始时间，-1 表示未在眨眼 */
  let blinkStart = -1

  /** 眼睛睁开程度（1 全开 → 0.08 接近全闭），眨眼周期约 160ms */
  function eyeOpenFactor(): number {
    if (blinkStart < 0) return 1
    const phase = (t - blinkStart) / 0.16
    if (phase >= 1) {
      blinkStart = -1
      nextBlinkAt = t + 2.2 + Math.random() * 3
      return 1
    }
    return 1 - Math.sin(Math.PI * phase) * 0.92
  }

  /** 面部：双眼（含高光点 + 眨眼 / 思考眯眼）+ 微笑 / 说话开合的嘴 */
  function drawFace() {
    if (!ctx || !gradients) return

    if (blinkStart < 0 && t >= nextBlinkAt) blinkStart = t
    const open = Math.max(eyeOpenFactor() * (statusLabel === 'thinking' ? 0.55 : 1), 0.08)

    ctx.fillStyle = gradients.face
    for (const side of [-1, 1]) {
      ctx.save()
      ctx.translate(side * 0.3, -0.12)
      ctx.scale(1, open)
      ctx.beginPath()
      ctx.ellipse(0, 0, 0.11, 0.145, 0, 0, Math.PI * 2)
      ctx.fill()
      // 高光点只在眼睛基本睁开时绘制，避免眨眼半程闪出白点
      if (open > 0.5) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
        ctx.beginPath()
        ctx.arc(-0.035, -0.05, 0.032, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = gradients.face
      }
      ctx.restore()
    }

    if (statusLabel === 'speaking') {
      // 说话：嘴随节奏开合
      const mouthRy = 0.05 + 0.045 * Math.abs(Math.sin(6 * t))
      ctx.beginPath()
      ctx.ellipse(0, 0.2, 0.1, mouthRy, 0, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // 平静 / 思考：微笑弧线
      ctx.strokeStyle = gradients.face
      ctx.lineWidth = 0.05
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-0.15, 0.13)
      ctx.quadraticCurveTo(0, 0.26, 0.15, 0.13)
      ctx.stroke()
    }
  }

  function applySize() {
    dpr = Math.min(globalThis.devicePixelRatio || 1, 2)
    const px = Math.max(1, Math.round(size * dpr))
    canvas.width = px
    canvas.height = px
  }

  function buildGradients(): OrbGradients | null {
    if (!ctx) return null

    const light = shiftLight(base, 26)
    const dark = shiftLight(base, -20)

    // 主体积光：光源在左上方
    const baseGradient = ctx.createRadialGradient(-0.35, -0.42, 0.05, 0, 0, 1.3)
    baseGradient.addColorStop(0, hslCss(light))
    baseGradient.addColorStop(0.45, hslCss(base))
    baseGradient.addColorStop(1, hslCss(dark))

    // 底部内发光，让球体「透」起来
    const glowGradient = ctx.createRadialGradient(0.1, 0.72, 0, 0.1, 0.72, 1.05)
    glowGradient.addColorStop(0, hslCss(shiftLight(base, 34), 0.55))
    glowGradient.addColorStop(1, hslCss(shiftLight(base, 34), 0))

    // 左上柔和高光斑
    const highlightGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.42)
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
    highlightGradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.28)')
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    return {
      base: baseGradient,
      glow: glowGradient,
      highlight: highlightGradient,
      face: hslCss({ h: base.h, s: Math.min(base.s, 50), l: 16 })
    }
  }

  /** 球面半径扰动：三层不同角频率的正弦叠加，营造有机感 */
  function wobble(theta: number, params: OrbParams): number {
    const { wobbleAmp, wobbleSpeed } = params
    const w1 = wobbleSpeed
    return (
      wobbleAmp *
      (0.58 * Math.sin(2 * theta + w1 * t) +
        0.3 * Math.sin(3 * theta - 1.6 * w1 * t + 1.7) +
        0.24 * Math.sin(5 * theta + 0.7 * w1 * t + 4.2))
    )
  }

  function drawBlob(params: OrbParams, radius: number, lift: number, heightFactor: number) {
    if (!ctx || !gradients) return

    // 挤压拉伸：落地压扁（体积守恒），滞空轻微拉长
    const impact = Math.pow(1 - heightFactor, 3)
    const stretch = heightFactor * heightFactor
    const breatheScale = 1 + params.breathe * Math.sin(Math.PI * t)
    const scaleY =
      (1 - params.squash * impact) * (1 + 0.45 * params.squash * stretch) * breatheScale
    const scaleX =
      ((1 + params.squash * impact) / (1 + 0.25 * params.squash * stretch)) * breatheScale

    const groundY = size * 0.82
    const cx = size / 2
    // 底部钉在地面线上（挤压时不会陷下去），再减去跳跃高度
    const cy = groundY - radius * scaleY - lift

    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(radius * scaleX, radius * scaleY)

    const path = new Path2D()
    for (let i = 0; i <= SEGMENTS; i++) {
      const theta = (i / SEGMENTS) * Math.PI * 2
      const r = 1 + wobble(theta, params)
      const x = r * Math.cos(theta)
      const y = r * Math.sin(theta)
      if (i === 0) path.moveTo(x, y)
      else path.lineTo(x, y)
    }
    path.closePath()

    ctx.fillStyle = gradients.base
    ctx.fill(path)

    ctx.clip(path)
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = gradients.glow
    ctx.fillRect(-1.4, -1.4, 2.8, 2.8)
    ctx.globalCompositeOperation = 'source-over'

    // 高光：旋转压扁的圆形渐变，形成椭圆光斑
    ctx.translate(-0.3, -0.42)
    ctx.rotate(-0.5)
    ctx.scale(1, 0.62)
    ctx.fillStyle = gradients.highlight
    ctx.beginPath()
    ctx.arc(0, 0, 1, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()

    // 面部在高光之后绘制（仍在球体局部空间，随挤压拉伸形变）
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(radius * scaleX, radius * scaleY)
    drawFace()
    ctx.restore()
  }

  function drawShadow(radius: number, heightFactor: number) {
    if (!ctx) return
    const groundY = size * 0.82
    const rx = radius * (0.88 - 0.32 * heightFactor)

    ctx.save()
    ctx.globalAlpha = 0.26 * (1 - 0.55 * heightFactor)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
    ctx.beginPath()
    ctx.ellipse(size / 2, groundY + size * 0.02, rx, rx * 0.2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  function draw() {
    if (!ctx) return

    // 状态参数向目标平滑过渡（约 200ms 时间常数）
    const ease = 1 - Math.exp(-frameDt * 5)
    for (const key of Object.keys(target) as (keyof OrbParams)[]) {
      current[key] += (target[key] - current[key]) * ease
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)

    const radius = size * 0.34
    const phase = (t * current.bounceFreq) % 1
    const heightFactor = Math.sin(Math.PI * phase)
    const lift = current.bounceAmp * radius * heightFactor

    drawShadow(radius, heightFactor)
    drawBlob(current, radius, lift, heightFactor)
  }

  function tick(now: number) {
    if (!isRunning) return
    frameDt = lastFrameAt === 0 ? 1 / 60 : Math.min((now - lastFrameAt) / 1000, 0.05)
    lastFrameAt = now
    t += frameDt
    draw()
    rafId = requestAnimationFrame(tick)
  }

  applySize()
  gradients = buildGradients()

  return {
    get running() {
      return isRunning
    },

    setStatus(status: AiOrbStatus) {
      statusLabel = status
      target = { ...STATUS_PARAMS[status] }
    },

    setColor(color: string) {
      const parsed = parseColor(color)
      if (!parsed) return
      base = parsed
      gradients = buildGradients()
      if (!isRunning) draw()
    },

    resize(nextSize: number) {
      if (nextSize === size) return
      size = nextSize
      applySize()
      if (!isRunning) draw()
    },

    start() {
      if (isRunning || !ctx) return
      isRunning = true
      lastFrameAt = 0
      rafId = requestAnimationFrame(tick)
    },

    stop() {
      isRunning = false
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
    },

    renderOnce() {
      // 固定在一个舒展的姿态：滞空中段、轻微拉伸
      t = 0.35
      frameDt = 1 / 60
      draw()
    }
  }
}
