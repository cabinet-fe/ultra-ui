# 补间 — API

```ts
declare const tweenEasings: Record<string, TweenEasing>

declare class Tween {
  constructor(options?: TweenOptions)
  play(): this
  pause(): this
  resume(): this
  cancel(): this
  reset(): this
  seek(progress: number): this
  setOptions(options: TweenOptions): this
  getState(): TweenState
  getValue(): number
  getProgress(): number
}
```

`TweenOptions` 含 `from`、`to`、`duration`、`easing`、`onUpdate`、`onComplete` 等，见 generated。
