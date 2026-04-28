# UFloatButton — 浮动按钮

> `import type { FloatButtonProps, FloatButtonEmits } from '@veltra/desktop'`

## Import

```ts
import { UFloatButton } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `items` | `FloatButtonItem[]` | — | 按钮菜单项
| `...ComponentProps` | — | — | 通用组件属性

## Emits

| event | 参数
|-------|------
| `click` | `(key: string)` — 点击菜单项

## Examples

```vue
<u-float-button :items="actions" @click="onAction" />
```
