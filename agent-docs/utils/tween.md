---
title: Tween 基于 requestAnimationFrame 的数值平滑补间动画类
description: 动画补间工具类，基于 requestAnimationFrame 驱动数值从起始值平滑过渡到目标值，支持 duration 时长、easing 缓动曲线与 update/done 回调，常用于数字滚动翻牌与动画过渡
---

`Tween` 对一份 `Record<string, number>` 状态做补间，原地改 `tween.state`。相关类型：`TweenConfig`（构造）、`AnimeConfig`（`to` / `back` 单次覆盖）。

## 构造 TweenConfig

| 字段             | 说明                                                       |
| ---------------- | ---------------------------------------------------------- |
| `duration`       | 毫秒，默认 `300`                                           |
| `easingFunction` | `(progress: number) => number`，默认 `Tween.easing.linear` |
| `onUpdate`       | 每帧状态更新后                                             |
| `onComplete`     | 动画结束（含被 `to` 打断后的新动画结束）                   |

## 方法

| 方法                 | 说明                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `to(state, config?)` | 停掉进行中的动画，补间到 `state` 中给出的键；`AnimeConfig` 可覆盖本次 `duration` / `easingFunction` / `onComplete` |
| `back(config?)`      | 补间回构造时的初始状态快照                                                                                         |

静态 `Tween.easing`：`linear`、`easeInQuad`、`easeOutQuad`、`easeInOutQuad`、`easeInBack`、`easeOutBack`、`easeInOutBack`。

```ts
import { Tween } from '@veltra/utils'

const number = { value: 0 }
const tween = new Tween(number, {
  duration: 800,
  easingFunction: Tween.easing.easeInOutQuad,
  onUpdate(state) {
    display.textContent = String(state.value)
  }
})

tween.to({ value: 100 })
tween.back()
```
