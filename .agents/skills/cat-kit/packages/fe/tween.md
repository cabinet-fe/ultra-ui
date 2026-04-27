# fe — tween

补间动画工具，支持自定义缓动函数和调度器。

## Tween

```ts
class Tween {
  constructor(options?: TweenOptions)
}
```

### 配置选项

```ts
interface TweenOptions {
  from?: number          // 起始值，默认 0
  to?: number            // 结束值，默认 1
  duration?: number      // 持续时间（ms），默认 300
  delay?: number         // 延迟开始（ms），默认 0
  easing?: TweenEasing   // 缓动函数，默认 linear
  autoplay?: boolean     // 是否自动播放，默认 false
  scheduler?: TweenScheduler  // 自定义帧调度器，默认 rAF
  onUpdate?: (frame: TweenFrame) => void
  onFinish?: (frame: TweenFrame) => void
  onCancel?: (frame: TweenFrame) => void
}
```

### 帧信息

```ts
interface TweenFrame {
  elapsed: number         // 已过毫秒（扣除 delay）
  progress: number        // 原始进度 [0, 1]
  easedProgress: number   // 缓动后进度 [0, 1]
  value: number           // from + (to - from) * easedProgress
  state: TweenState       // 'idle' | 'running' | 'paused' | 'finished' | 'cancelled'
}
```

### 控制方法

| 方法 | 说明 |
|------|------|
| `.play()` | 开始/重头播放 |
| `.pause()` | 暂停（仅 running 态） |
| `.resume()` | 从暂停点恢复 |
| `.cancel()` | 取消动画，触发 onCancel + onUpdate |
| `.reset()` | 回到初始状态（idle, value=from, progress=0） |
| `.seek(progress)` | 跳到指定进度 [0, 1] |

### 查询方法

| 方法 | 说明 |
|------|------|
| `.getState()` | 返回当前状态 |
| `.getValue()` | 返回当前插值 |
| `.getProgress()` | 返回当前进度 [0, 1] |
| `.setOptions(opts)` | 运行时更新参数 |

## 内置缓动函数

```ts
const tweenEasings = {
  linear:      (t: number) => t,
  easeInQuad:  (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad:(t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
}
```

## 示例

```ts
import { Tween, tweenEasings } from '@cat-kit/fe'

// 平移动画
const tween = new Tween({
  from: 0,
  to: 100,
  duration: 500,
  easing: tweenEasings.easeOutQuad,
  onUpdate: ({ value }) => {
    element.style.transform = `translateX(${value}px)`
  },
  onFinish: () => console.log('done'),
})

tween.play()
```

> 类型签名：`../../generated/fe/tween.d.ts`
