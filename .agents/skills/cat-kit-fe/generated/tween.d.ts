//#region src/tween.d.ts
type TweenState = 'idle' | 'running' | 'paused' | 'finished' | 'cancelled'
type TweenEasing = (progress: number) => number
interface TweenScheduler {
  now(): number
  requestFrame(callback: FrameRequestCallback): number
  cancelFrame(handle: number): void
}
interface TweenFrame {
  elapsed: number
  progress: number
  easedProgress: number
  value: number
  state: TweenState
}
interface TweenOptions {
  from?: number
  to?: number
  duration?: number
  delay?: number
  easing?: TweenEasing
  autoplay?: boolean
  scheduler?: TweenScheduler
  onUpdate?: (frame: TweenFrame) => void
  onFinish?: (frame: TweenFrame) => void
  onCancel?: (frame: TweenFrame) => void
}
declare const tweenEasings: {
  linear: (progress: number) => number
  easeInQuad: (progress: number) => number
  easeOutQuad: (progress: number) => number
  easeInOutQuad: (progress: number) => number
}
declare class Tween {
  private from
  private to
  private duration
  private delay
  private easing
  private scheduler
  private onUpdate?
  private onFinish?
  private onCancel?
  private state
  private startedAt
  private pausedElapsed
  private handle
  private progress
  private value
  constructor(options?: TweenOptions)
  getState(): TweenState
  getValue(): number
  getProgress(): number
  setOptions(options: TweenOptions): this
  play(): this
  pause(): this
  resume(): this
  cancel(): this
  reset(): this
  seek(progress: number): this
  private applyOptions
  private schedule
  private tick
  private currentElapsed
  private interpolate
  private createFrame
  private emitUpdate
  private cancelFrame
}
//#endregion
export { Tween, TweenEasing, TweenFrame, TweenOptions, TweenScheduler, TweenState, tweenEasings }
