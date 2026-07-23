# useTransition - 命令式过渡

## 示例

见 `./examples.md`

## 类型

```ts
import type { CSSProperties, Ref, ShallowRef } from 'vue'

interface TransitionBase {
  target: ShallowRef<HTMLElement | undefined> | HTMLElement
  afterEnter?: () => void
  enterCanceled?: () => void
  afterLeave?: () => void
  leaveCanceled?: () => void
}

interface CssTransitionOptions extends TransitionBase {
  /** 生成 `${name}-enter-from|active|to` 与 `${name}-leave-from|active|to` */
  name: ShallowRef<string> | string | Ref<string>
  keepEnterTo?: boolean
}

interface StyleTransitionOptions extends TransitionBase {
  enterTo: CSSProperties
  enterActive: CSSProperties
  leaveActive: CSSProperties
}

interface UseTransitionReturned {
  toggle(active: boolean | ((active: boolean) => boolean)): void
  enter(): void
  leave(): void
}

function useTransition(type: 'css', options: CssTransitionOptions): UseTransitionReturned
function useTransition(type: 'style', options: StyleTransitionOptions): UseTransitionReturned
```

## 说明

- 两种类型签名不同，均返回 `{ toggle, enter, leave }`；`enter` / `leave` 分别是 `toggle(true)` / `toggle(false)` 别名。
- CSS 模式按 `name` 拼类名；`keepEnterTo` 为 true 时进入结束后保留 `*-enter-to`。
