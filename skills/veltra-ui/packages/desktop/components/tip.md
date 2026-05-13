# UTip — 提示

> `import type { TipProps, TipEmits } from '@veltra/desktop'`

浮层提示组件，支持 hover / click 触发，可自定义弹出方向和内容。

## Import

```ts
// UTip 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `visible` | `boolean` | `undefined` | 控制显隐 |
| `content` | `string` | `''` | 提示内容 |
| `style` | `CSSProperties \| string` | — | 自定义 tip 样式 |
| `class` | `string \| string[] \| Record<string, boolean>` | — | 自定义 tip 的 class |
| `trigger` | `'hover' \| 'click'` | `'hover'` | 触发方式 |
| `triggerDom` | `HTMLElement` | — | 触发元素，指定后弹框将相对于该元素定位 |
| `direction` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | 弹出方向 |
| `alignment` | `'center' \| 'start' \| 'end'` | `'center'` | 对齐方式 |
| `hideArrow` | `boolean` | — | 隐藏箭头 |
| `contentTag` | `string` | `'div'` | tip 内容容器标签 |
| `disabled` | `boolean` | — | 禁用 tip |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:visible` | `(value: boolean)` | 显隐状态变化（`visible` 受控时触发） |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 触发元素（取第一个合法 VNode） |
| `content` | — | 提示内容，优先级高于 `content` prop |

## Exposed

```ts
interface TipExposed {
  // 无暴露方法/属性
}
```

## Examples

### hover 触发

```vue
<template>
  <UTip content="这是一段提示文本">
    <UButton>悬停查看</UButton>
  </UTip>
</template>
```

### click 触发

```vue
<template>
  <UTip content="点击后显示的提示" trigger="click">
    <UButton>点击查看</UButton>
  </UTip>
</template>
```

### 自定义触发元素

```vue
<template>
  <UTip content="提示文本" :trigger-dom="customEl">
    <span>这段文本不会作为定位基准</span>
  </UTip>
  <div ref="customEl">实际定位基准元素</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const customEl = ref<HTMLElement>()
</script>
```

### 自定义方向和对齐

```vue
<template>
  <UTip content="提示内容" direction="bottom" alignment="start">
    <UButton>底部对齐</UButton>
  </UTip>
</template>
```

### 隐藏箭头

```vue
<template>
  <UTip content="无箭头的提示" :hide-arrow="true">
    <UButton>无箭头</UButton>
  </UTip>
</template>
```

### 受控显隐

```vue
<template>
  <UTip content="受控提示" :visible="visible" @update:visible="visible = $event">
    <UButton>受控显示</UButton>
  </UTip>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const visible = ref(false)
</script>
```

### 禁用状态

```vue
<template>
  <UTip content="这段提示不会显示" disabled>
    <UButton>禁用提示</UButton>
  </UTip>
</template>
```
