# fe — 补间动画

## 何时使用

用回调驱动数值动画或可控时间轴。

## 推荐公开 API

`Tween`、`tweenEasings`

```ts
import { Tween, tweenEasings } from '@cat-kit/fe'

new Tween({
  from: 0,
  to: 100,
  duration: 400,
  easing: tweenEasings.easeOutQuad,
  onUpdate: ({ value }) => {
    void value
  }
}).play()
```

详情见 [apis.md](apis.md)。

## 约束

控制：`play`、`pause`、`resume`、`cancel`、`reset`、`seek`、`setOptions`；状态：`getState`、`getValue`、`getProgress`。

## 类型入口

[tween.d.ts](../../../generated/fe/tween.d.ts)
