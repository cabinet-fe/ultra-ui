/** 自 cat-kit 3.x Tween 行为对齐的轻量动画（原 `cat-kit/fe` 导出） */

export interface AnimeConfig<State extends Record<string, number>> {
  duration?: number
  easingFunction?: (progress: number) => number
  onComplete?(state: State): void
}

export interface TweenConfig<State extends Record<string, number>> {
  duration?: number
  onUpdate?(state: State): void
  onComplete?(state: State): void
  easingFunction?: (progress: number) => number
}

export class Tween<State extends Record<string, number> = Record<string, number>> {
  readonly state: State
  protected duration = 300
  protected onUpdate?: (state: State) => void
  protected onComplete?: (state: State) => void
  protected frameId?: number
  protected easingFunction: (progress: number) => number
  private defaultState: State

  constructor(state: State, config?: TweenConfig<State>) {
    this.state = state
    this.defaultState = { ...state }
    const { duration, onUpdate, onComplete, easingFunction } = config || {}
    if (duration !== undefined) this.duration = duration
    if (onUpdate !== undefined) this.onUpdate = onUpdate
    if (onComplete !== undefined) this.onComplete = onComplete
    this.easingFunction = easingFunction ?? Tween.easing.linear
  }

  protected raf(options: {
    onComplete: () => void
    duration: number
    tick: (p: number) => void
  }): void {
    const start = performance.now()
    const { onComplete, tick, duration } = options
    const update = (timestamp: number) => {
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      tick(progress)
      if (progress < 1) {
        this.frameId = requestAnimationFrame(update)
      } else {
        tick(progress)
        this.stop()
        onComplete()
      }
    }
    this.frameId = requestAnimationFrame(update)
  }

  to(state: Partial<State>, config?: AnimeConfig<State>): void {
    this.stop()
    const prevState = { ...this.state }
    const stateDistance = Object.keys(state).reduce(
      (acc, key) => {
        const k = key as keyof State
        const sv = state[k] as number
        const pv = prevState[k] as number
        if ((sv || sv === 0) && (pv || pv === 0)) {
          acc[key] = sv - pv
        }
        return acc
      },
      {} as Record<string, number>
    )
    const duration = config?.duration || this.duration
    const easingFunction = config?.easingFunction || this.easingFunction
    const onComplete = config?.onComplete || this.onComplete
    this.raf({
      duration,
      onComplete: () => {
        for (const key in state) {
          if (key in this.state) {
            ;(this.state as Record<string, number>)[key] = state[key as keyof State] as number
          }
        }
        this.onUpdate?.(this.state)
        onComplete?.(this.state)
      },
      tick: (progress) => {
        for (const key in stateDistance) {
          const pk = key as keyof State
          const target = (prevState[pk] as number) + easingFunction(progress) * stateDistance[key]!
          ;(this.state as Record<string, number>)[key] = target
        }
        this.onUpdate?.(this.state)
      }
    })
  }

  back(config?: AnimeConfig<State>): void {
    this.to(this.defaultState as Partial<State>, config)
  }

  private stop(): boolean {
    if (!this.frameId) return false
    cancelAnimationFrame(this.frameId)
    this.frameId = undefined
    return true
  }

  static readonly easing = {
    linear: (p: number) => p,
    easeInQuad: (p: number) => p * p,
    easeOutQuad: (p: number) => p * (2 - p),
    easeInOutQuad: (p: number) => (p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p),
    easeInBack: (p: number) => p * p * ((2.70158 + 1) * p - 1),
    easeOutBack: (p: number) => 1 + 2.70158 * Math.pow(p - 1, 3) + 1.70158 * Math.pow(p - 1, 2),
    easeInOutBack: (p: number) => {
      const c1 = 1.70158
      const c2 = c1 * 1.525
      return p < 0.5
        ? (Math.pow(2 * p, 2) * ((c2 + 1) * 2 * p - c2)) / 2
        : (Math.pow(2 * p - 2, 2) * ((c2 + 1) * (p * 2 - 2) + c2) + 2) / 2
    }
  }
}
