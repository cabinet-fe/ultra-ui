import type { AiOrbReaction, AiOrbStatus } from '../../types/ai-orb'

/** 常态动画参数（数值均为无量纲，随尺寸缩放） */
interface OrbParams {
  /** 常态睁眼度（0-1，1 全开；thinking 微微眯起） */
  eyeOpen: number
  /** 呼吸缩振幅（相对球半径） */
  breathe: number
  /** 呼吸频率（Hz） */
  breatheFreq: number
  /** 表面扰动幅度（相对球半径） */
  wobbleAmp: number
  /** 表面扰动速度 */
  wobbleSpeed: number
}

const STATUS_PARAMS: Record<AiOrbStatus, OrbParams> = {
  idle: { eyeOpen: 1, breathe: 0.02, breatheFreq: 0.28, wobbleAmp: 0.012, wobbleSpeed: 1 },
  thinking: { eyeOpen: 0.72, breathe: 0.012, breatheFreq: 0.2, wobbleAmp: 0.016, wobbleSpeed: 1.6 },
  speaking: { eyeOpen: 1, breathe: 0.026, breatheFreq: 0.45, wobbleAmp: 0.018, wobbleSpeed: 2.2 }
}

/** 眼睛形态：圆眼（可眨眼 / 睁大）/ 开心弯眼 / 紧闭 >< */
type EyeMode = 'round' | 'happy' | 'squint'
/** 嘴部形态；none 表示无嘴（常态只有大眼睛，说话 / 表情时才出现嘴） */
type MouthMode = 'none' | 'smile' | 'flat' | 'talk' | 'grin' | 'frown' | 'o'

const STATUS_MOUTH: Record<AiOrbStatus, MouthMode> = {
  idle: 'none',
  thinking: 'none',
  speaking: 'talk'
}

interface ReactionDef {
  /** 表情总时长（秒） */
  duration: number
  eyeMode: EyeMode
  /** 睁眼倍率（>1 为睁大） */
  eyeScale: number
  mouth: MouthMode
  /** 表情期间视线落点（单位球空间） */
  gaze: { x: number; y: number }
}

const REACTIONS: Record<AiOrbReaction, ReactionDef> = {
  happy: { duration: 1.7, eyeMode: 'happy', eyeScale: 1, mouth: 'grin', gaze: { x: 0, y: -0.05 } },
  shock: { duration: 1.2, eyeMode: 'round', eyeScale: 1.22, mouth: 'o', gaze: { x: 0, y: -0.02 } },
  frustrated: {
    duration: 1.5,
    eyeMode: 'squint',
    eyeScale: 1,
    mouth: 'frown',
    gaze: { x: 0, y: 0.02 }
  }
}

/** happy 前段先睁大双眼，随后才切换弯眼（占表情时长比例） */
const HAPPY_WIDEN_RATIO = 0.2

/**
 * 固定配色：扁平纯色、无打光，饱满的天然蔚蓝球体 + 白色五官，
 * 不跟随宿主主题，保证任何场景下观感一致。
 */
const COLORS = { body: '#3d9bf0', face: '#ffffff' } as const

/** 球体横竖比：扁椭圆（mochi 感），呼吸在此之上微调 */
const BODY_SCALE_X = 1.1
const BODY_SCALE_Y = 0.92

/** 竖椭圆大眼睛（单位球空间）：竖长才像眼睛，正圆容易读成鼻孔 */
const EYE_X = 0.27
const EYE_Y = -0.12
const EYE_RX = 0.13
const EYE_RY = 0.19

export interface AiOrbRendererOptions {
  /** css 像素尺寸（画布为正方形） */
  size: number
  status?: AiOrbStatus
}

export interface AiOrbRenderer {
  /** 目标状态切换（参数平滑过渡，无跳变） */
  setStatus(status: AiOrbStatus): void
  /** 播放一次瞬时表情（happy / shock / frustrated），播完自动回到常态 */
  trigger(reaction: AiOrbReaction): void
  /** 指针位置（单位球空间，可超出球体范围），null 表示指针离开；用于视线跟随 */
  setPointer(pos: { x: number; y: number } | null): void
  /** 戳一下：Q 弹挤压回弹（约 0.95s） */
  poke(): void
  resize(size: number): void
  start(): void
  stop(): void
  /** 绘制一帧静态画面（prefers-reduced-motion 降级用；有未播完的表情时定格表情中段） */
  renderOnce(): void
  readonly running: boolean
}

/** 组合圆路径的点数（越大越平滑，36 在小尺寸下已足够） */
const SEGMENTS = 36

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function lerp(from: number, to: number, k: number): number {
  return from + (to - from) * k
}

function easeInOut(k: number): number {
  return k * k * (3 - 2 * k)
}

/** 表情权重包络：快速淡入（前 12%）→ 保持 → 淡出（后 22%） */
function reactionEnvelope(p: number): number {
  return easeInOut(clamp(Math.min(p / 0.12, (1 - p) / 0.22), 0, 1))
}

/**
 * 纯 canvas 2D 活体球渲染器（框架无关）。
 *
 * 造型：原地呼吸的扁椭圆纯色球（无弹跳、无打光），固定配色。
 * 灵动感的核心在眼部状态机：
 * - 白色大眼睛随机眨眼（约 18% 概率双眨），闭起为白色线条
 * - 视线游移 / 转头（面部整体平移 + 轻微倾斜，idle 随机、thinking 缓慢扫视）
 * - 瞬时表情（{@link AiOrbReaction}）：睁大眼、弯眼笑、紧闭眼 ><，配合点头 / 摇头 / 后仰
 *
 * 性能设计：
 * - 单位球空间（R=1）绘制，单条 36 段多边形路径，纯色填充，无渐变 / 滤镜 / shadowBlur
 * - rAF 循环由组件侧按可见性启停；dt 截断避免后台切回时的跳变
 */
export function createOrbRenderer(
  canvas: HTMLCanvasElement,
  options: AiOrbRendererOptions
): AiOrbRenderer {
  const ctx = canvas.getContext('2d')

  let size = options.size
  let dpr = 1

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

  /** 下一次眨眼时间点（秒，随机间隔） */
  let nextBlinkAt = 1.6 + Math.random() * 3
  /** 眨眼起始时间，-1 表示未在眨眼 */
  let blinkStart = -1

  /** 视线（单位球空间）：current 缓动逼近 target */
  const gazeCur = { x: 0, y: 0 }
  let gazeTarget = { x: 0, y: 0 }
  /** idle 态下一次游移视线的时间点 */
  let nextGazeAt = 1.2 + Math.random() * 2

  /** 进行中的瞬时表情 */
  let reaction: { type: AiOrbReaction; startAt: number } | null = null

  /** 指针悬停位置（单位球空间）；null 表示未悬停，此时按 status 驱动视线 */
  let pointerPos: { x: number; y: number } | null = null
  /** Q 弹起始时间，-1 表示未在回弹 */
  let pokeStart = -1

  /** 面部：白色大眼睛（圆眼 / 弯眼 / 紧闭线条）+ 嘴 */
  function drawFace(eyeMode: EyeMode, eyeOpen: number, eyeScale: number, mouth: MouthMode) {
    if (!ctx) return

    ctx.fillStyle = COLORS.face
    ctx.strokeStyle = COLORS.face
    ctx.lineCap = 'round'

    for (const side of [-1, 1]) {
      ctx.save()
      ctx.translate(side * EYE_X, EYE_Y)

      if (eyeMode === 'round') {
        // 圆眼：竖直方向缩放表达睁眼度；闭起时压成白色线条
        const open = clamp(eyeOpen, 0.07, 1)
        ctx.save()
        ctx.scale(1, open)
        ctx.beginPath()
        ctx.ellipse(0, 0, EYE_RX * eyeScale, EYE_RY * eyeScale, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      } else if (eyeMode === 'happy') {
        // 开心弯眼：上半圆白色线条（∩）
        ctx.lineWidth = 0.06
        ctx.beginPath()
        ctx.arc(0, 0.05, 0.14, Math.PI, Math.PI * 2)
        ctx.stroke()
      } else {
        // 紧闭眼：>< 白色折线（顶点朝向鼻梁）
        ctx.lineWidth = 0.055
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(0.085 * side, -0.08)
        ctx.lineTo(-0.065 * side, 0)
        ctx.lineTo(0.085 * side, 0.08)
        ctx.stroke()
      }

      ctx.restore()
    }

    drawMouth(mouth)
  }

  function drawMouth(mouth: MouthMode) {
    if (!ctx || mouth === 'none') return
    ctx.fillStyle = COLORS.face
    ctx.strokeStyle = COLORS.face

    switch (mouth) {
      case 'smile':
        ctx.lineWidth = 0.05
        ctx.beginPath()
        ctx.moveTo(-0.15, 0.18)
        ctx.quadraticCurveTo(0, 0.32, 0.15, 0.18)
        ctx.stroke()
        break
      case 'flat':
        // 思考：近乎平直的小嘴
        ctx.lineWidth = 0.045
        ctx.beginPath()
        ctx.moveTo(-0.09, 0.24)
        ctx.quadraticCurveTo(0, 0.255, 0.09, 0.24)
        ctx.stroke()
        break
      case 'talk': {
        // 说话：嘴随节奏开合
        const ry = 0.045 + 0.05 * Math.abs(Math.sin(6.5 * t))
        ctx.beginPath()
        ctx.ellipse(0, 0.2, 0.1, ry, 0, 0, Math.PI * 2)
        ctx.fill()
        break
      }
      case 'grin':
        // 大笑：张开的半圆嘴
        ctx.beginPath()
        ctx.ellipse(0, 0.15, 0.15, 0.115, 0, 0, Math.PI)
        ctx.closePath()
        ctx.fill()
        break
      case 'frown':
        ctx.lineWidth = 0.05
        ctx.beginPath()
        ctx.moveTo(-0.1, 0.28)
        ctx.quadraticCurveTo(0, 0.2, 0.1, 0.28)
        ctx.stroke()
        break
      case 'o':
        // 惊讶：小嘴微张
        ctx.beginPath()
        ctx.ellipse(0, 0.21, 0.06, 0.078, 0, 0, Math.PI * 2)
        ctx.fill()
        break
    }
  }

  function applySize() {
    dpr = Math.min(globalThis.devicePixelRatio || 1, 2)
    const px = Math.max(1, Math.round(size * dpr))
    canvas.width = px
    canvas.height = px
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

  function draw() {
    if (!ctx) return

    // 常态参数向目标平滑过渡（约 200ms 时间常数）
    const ease = 1 - Math.exp(-frameDt * 5)
    for (const key of Object.keys(target) as (keyof OrbParams)[]) {
      current[key] += (target[key] - current[key]) * ease
    }

    // 眨眼：随机触发，结束时有概率紧接着补一次形成双眨；表情期间不插播
    if (blinkStart < 0 && !reaction && t >= nextBlinkAt) blinkStart = t
    let blinkOpen = 1
    if (blinkStart >= 0) {
      const phase = (t - blinkStart) / 0.16
      if (phase >= 1) {
        blinkStart = -1
        nextBlinkAt = Math.random() < 0.18 ? t + 0.26 : t + 2.2 + Math.random() * 2.6
      } else {
        blinkOpen = 1 - Math.sin(Math.PI * phase) * 0.94
      }
    }

    // 瞬时表情进度（播完自动清除）
    let reactionDef: ReactionDef | null = null
    let reactionP = 0
    let reactionW = 0
    if (reaction) {
      const def = REACTIONS[reaction.type]
      reactionP = (t - reaction.startAt) / def.duration
      if (reactionP >= 1) {
        reaction = null
      } else {
        reactionDef = def
        reactionW = reactionEnvelope(reactionP)
      }
    }

    // 视线目标：表情 > 指针跟随 > thinking 扫视 > speaking 微动 > idle 随机游移（转头 / 转眼睛）
    if (reactionDef && reactionW > 0.45) {
      gazeTarget = reactionDef.gaze
    } else if (pointerPos) {
      // 悬停互动：看向指针所在方位
      gazeTarget = { x: clamp(pointerPos.x, -0.18, 0.18), y: clamp(pointerPos.y, -0.1, 0.12) }
    } else if (statusLabel === 'thinking') {
      // 思考：视线略上扬并缓慢左右扫视
      gazeTarget = { x: 0.13 * Math.sin(t * 0.7), y: -0.05 + 0.03 * Math.sin(t * 0.47) }
    } else if (statusLabel === 'speaking') {
      gazeTarget = { x: 0.03 * Math.sin(t * 1.2), y: 0.02 * Math.sin(t * 0.8) }
    } else if (t >= nextGazeAt) {
      const far = Math.random() < 0.3
      gazeTarget = {
        x: (Math.random() * 2 - 1) * (far ? 0.16 : 0.07),
        y: (Math.random() * 2 - 1) * 0.06 - 0.01
      }
      nextGazeAt = t + 1.4 + Math.random() * 2.2
    }
    const gazeEase = 1 - Math.exp(-frameDt * 6.5)
    gazeCur.x += (gazeTarget.x - gazeCur.x) * gazeEase
    gazeCur.y += (gazeTarget.y - gazeCur.y) * gazeEase

    // 眼部参数：常态 × 眨眼，再向表情目标混合
    let eyeOpen = current.eyeOpen * blinkOpen
    let eyeScale = 1
    let eyeMode: EyeMode = 'round'
    let mouth: MouthMode = STATUS_MOUTH[statusLabel]
    if (reactionDef && reaction) {
      // happy 前段先睁大双眼（round），随后才切换弯眼
      const widenPhase = reaction.type === 'happy' && reactionP < HAPPY_WIDEN_RATIO
      eyeScale = lerp(1, widenPhase ? 1.2 : reactionDef.eyeScale, reactionW)
      eyeOpen = lerp(eyeOpen, 1, reactionW)
      if (reactionW > 0.45) {
        eyeMode = widenPhase ? 'round' : reactionDef.eyeMode
        mouth = reactionDef.mouth
      }
    }

    // 表情肢体动作：点头 / 摇头 / 后仰；平时视线侧移带一点头部倾斜（转头感）
    let bodyDy = 0
    let bodyRot = gazeCur.x * 0.5
    let bodyScale = 1
    if (reactionDef && reaction && reactionW > 0.01) {
      if (reaction.type === 'happy') {
        bodyDy = Math.sin(Math.min(reactionP / 0.75, 1) * Math.PI) * 0.05
      } else if (reaction.type === 'frustrated') {
        bodyRot += Math.sin(reactionP * reactionDef.duration * 18) * 0.05 * (1 - reactionP)
      } else {
        bodyScale = 1 - 0.05 * Math.sin(Math.min(reactionP * 1.6, 1) * Math.PI)
      }
    }

    // 扁椭圆 + 呼吸（原地，无弹跳）；Q 弹：挤压后阻尼振荡回弹（体积近似守恒）
    // press 包络让压下也走一个短渐入（约 80ms），避免按下瞬间球体跳变压扁
    // 低阻尼 + 约 1.6 周期 / 0.95s（≈1.7Hz）：回弹带过冲和一次可见的二次晃动，Q 而不抖
    let jellyX = 1
    let jellyY = 1
    if (pokeStart >= 0) {
      const pp = (t - pokeStart) / 0.95
      if (pp >= 1) {
        pokeStart = -1
      } else {
        const press = 1 - Math.exp(-pp * 14)
        const jelly = press * Math.exp(-2.6 * pp) * Math.cos(Math.PI * 2 * 1.6 * pp)
        jellyY = 1 - 0.14 * jelly
        jellyX = 1 + 0.085 * jelly
      }
    }
    const radius = size * 0.36
    const breatheScale = 1 + current.breathe * Math.sin(Math.PI * 2 * current.breatheFreq * t)
    const scaleX = BODY_SCALE_X * breatheScale * bodyScale * jellyX
    const scaleY = BODY_SCALE_Y * breatheScale * bodyScale * jellyY
    const cx = size / 2
    const cy = size / 2 + bodyDy * radius

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)

    // 纯色球体：单条扰动路径填充，无渐变与打光
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(bodyRot)
    ctx.scale(radius * scaleX, radius * scaleY)

    ctx.beginPath()
    for (let i = 0; i <= SEGMENTS; i++) {
      const theta = (i / SEGMENTS) * Math.PI * 2
      const r = 1 + wobble(theta, current)
      const x = r * Math.cos(theta)
      const y = r * Math.sin(theta)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = COLORS.body
    ctx.fill()

    // 面部随球体形变，并叠加视线平移 / 头部微倾
    ctx.translate(gazeCur.x, gazeCur.y)
    ctx.rotate(gazeCur.x * 0.35)
    drawFace(eyeMode, eyeOpen, eyeScale, mouth)

    ctx.restore()
  }

  function tick(now: number) {
    if (!isRunning) return
    frameDt = lastFrameAt === 0 ? 1 / 60 : Math.min((now - lastFrameAt) / 1000, 0.05)
    lastFrameAt = now
    t += frameDt
    draw()
    rafId = requestAnimationFrame(tick)
  }

  function renderOnce() {
    frameDt = 1 / 60
    // 静态帧优先级：进行中的表情定格在中段 > Q 弹定格在挤压段 > 常态安静帧
    if (reaction) {
      t = reaction.startAt + REACTIONS[reaction.type].duration * 0.45
    } else if (pokeStart >= 0) {
      t = pokeStart + 0.2
    } else {
      t = 0.35
    }
    gazeCur.x = 0
    gazeCur.y = 0
    gazeTarget = { x: 0, y: 0 }
    draw()
  }

  applySize()

  return {
    get running() {
      return isRunning
    },

    setStatus(status: AiOrbStatus) {
      statusLabel = status
      target = { ...STATUS_PARAMS[status] }
    },

    trigger(type: AiOrbReaction) {
      reaction = { type, startAt: t }
      // 表情接管眼部，中断进行中的眨眼
      blinkStart = -1
      if (!isRunning) renderOnce()
    },

    setPointer(pos: { x: number; y: number } | null) {
      pointerPos = pos
    },

    poke() {
      pokeStart = t
      if (!isRunning) renderOnce()
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

    renderOnce
  }
}
