export type TweenAnimeConfig<State> = {
  duration?: number
  easingFunction?: (progress: number) => number
  onComplete?(state: State): void
}

export type TweenConfig<State extends Record<string, number>> = {
  duration?: number
  onUpdate?(state: State): void
  onComplete?(state: State): void
  easingFunction?: (progress: number) => number
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export class Tween<State extends Record<string, number> = Record<string, number>> {
  static readonly easing = {
    linear: (p: number) => p,
    easeInQuad: (p: number) => p * p,
    easeOutQuad: (p: number) => p * (2 - p),
    easeInOutQuad: (p: number) =>
      p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p,
    easeInBack: (p: number) => {
      const c1 = 1.70158
      const c3 = c1 + 1
      return c3 * p * p * p - c1 * p * p
    },
    easeOutBack: (p: number) => {
      const c1 = 1.70158
      const c3 = c1 + 1
      return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2
    },
    easeInOutBack: (p: number) => {
      const c1 = 1.70158
      const c2 = c1 * 1.525
      return p < 0.5
        ? (2 * p) ** 2 * ((c2 + 1) * 2 * p - c2) / 2
        : ((2 * p - 2) ** 2 * ((c2 + 1) * (p * 2 - 2) + c2) + 2) / 2
    }
  }

  state: State
  protected duration: number
  protected onUpdate?: (state: State) => void
  protected onComplete?: (state: State) => void
  protected frameId?: number
  protected easingFunction: (progress: number) => number

  constructor(state: State, config?: TweenConfig<State>) {
    this.state = state
    this.duration = config?.duration ?? 300
    this.onUpdate = config?.onUpdate
    this.onComplete = config?.onComplete
    this.easingFunction =
      config?.easingFunction ?? Tween.easing.easeInOutQuad
  }

  to(target: Partial<State>, config?: TweenAnimeConfig<State>): void {
    this.stop()
    const duration = config?.duration ?? this.duration
    const easing = config?.easingFunction ?? this.easingFunction
    const onComplete = config?.onComplete ?? this.onComplete
    const keys = Object.keys(target) as (keyof State)[]
    const from: Record<string, number> = {}
    for (const k of keys) {
      const cur = this.state[k]
      const end = target[k]!
      from[k as string] = cur ?? end
    }
    const toVals = target as Record<string, number>
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const p = Math.min(1, elapsed / duration)
      const e = easing(p)
      for (const k of keys) {
        ;(this.state as Record<string, number>)[k as string] = lerp(
          from[k as string]!,
          toVals[k as string]!,
          e
        )
      }
      this.onUpdate?.(this.state)
      if (p < 1) {
        this.frameId = requestAnimationFrame(tick)
      } else {
        this.frameId = undefined
        onComplete?.(this.state)
      }
    }
    this.frameId = requestAnimationFrame(tick)
  }

  back(_config?: TweenAnimeConfig<State>): void {
    /* 当前构建未使用 */
  }

  private stop(): void {
    if (this.frameId !== undefined) {
      cancelAnimationFrame(this.frameId)
      this.frameId = undefined
    }
  }
}
