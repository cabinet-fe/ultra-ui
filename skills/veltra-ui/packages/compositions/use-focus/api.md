# useFocus - 焦点状态

## 示例

见 `./examples.md`

## 类型

```ts
import type { Ref } from 'vue'

function useFocus(cb?: (focused: boolean) => void): {
  focus: Ref<boolean>
  handleFocus: () => void
  handleBlur: () => void
}
```

## 说明

- `handleFocus` / `handleBlur` 分别把 `focus` 设为 `true` / `false`，并可选回调当前值。
- 通常绑定到模板 `@focus` / `@blur`。
