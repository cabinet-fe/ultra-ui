---
title: useTransition 命令式过渡
description: 按 css 类名或内联 style 驱动进入 / 离开过渡
---

`useTransition` 有两种签名：`'css'` 按类名过渡，`'style'` 按内联样式过渡。都返回 `{ toggle, enter, leave }`，`enter` / `leave` 分别是 `toggle(true)` / `toggle(false)`。

CSS 模式会生成 `${name}-enter-from|active|to` 与 `${name}-leave-from|active|to`。阶段结束按计算后的过渡时长定时，进入与离开互相打断时不会卡在半途。`keepEnterTo` 为 `true` 时进入结束后保留 `*-enter-to`。

```ts
import { shallowRef } from 'vue'
import { useTransition } from '@veltra/compositions'

const panel = shallowRef<HTMLElement>()

const css = useTransition('css', {
  target: panel,
  name: 'fade',
  keepEnterTo: true,
  afterEnter() {},
  afterLeave() {}
})

css.enter()
css.leave()
css.toggle((active) => !active)
```

Style 模式需要 `enterTo`、`enterActive`、`leaveActive`：

```ts
const box = shallowRef<HTMLElement>()

const style = useTransition('style', {
  target: box,
  enterTo: { opacity: '1' },
  enterActive: { transition: 'opacity 200ms' },
  leaveActive: { transition: 'opacity 160ms' }
})

style.toggle(true)
```

`target` 可以是元素本身或 `ShallowRef<HTMLElement | undefined>`。可选回调还有 `enterCanceled`、`leaveCanceled`（CSS 实现里阶段被打断时由新阶段接管，不会触发取消回调）。
