# useModel - 双向绑定

## 示例

见 `./examples.md`

## 类型

```ts
import type { Ref } from 'vue'

interface ModelOptions<Props extends Record<string, unknown>, Name extends keyof Props> {
  props: Props
  emit: (...args: any[]) => void
  /** @default 'modelValue' */
  propName?: Name
  /** @default true；函数则每次 set 时求值 */
  local?: boolean | (() => boolean)
  defaultValue?: Props[Name]
  /** @default false */
  shallow?: boolean
}

function useModel<
  Props extends Record<string, any>,
  Name extends keyof Props = 'modelValue'
>(
  options: ModelOptions<Props, Name>
): Ref<Props[Name] | undefined>
```

## 说明

- `local: true`（默认）：内部维护副本，set 时 emit + 更新本地；props 变化经 watch 同步。
- `local: false`：纯代理，get 读 props，set 仅 emit。
- `local: () => boolean`：可按 props 是否受控动态切换。
- `propName` 自定义绑定名（如 `visible` → `update:visible`）。
