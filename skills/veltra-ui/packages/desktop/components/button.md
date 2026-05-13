# UButton — 按钮

> `import type { ButtonProps, ButtonExposed } from '@veltra/desktop'`

触发操作的通用按钮组件，支持多种语义类型、尺寸、图标、加载态、朴素/文本模式，内置波纹指令。

## Import

```ts
// UButton、UButtonGroup 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `type` | `ColorType` | — | `'primary'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` |
| `size` | `ComponentSize` | `'default'` | `'small'` \| `'default'` \| `'large'` |
| `text` | `boolean` | — | 文本模式（无背景无边框） |
| `plain` | `boolean` | — | 朴素模式（边框 + 文字使用 type 色） |
| `loading` | `boolean` | — | 加载中，显示 loadingIcon 并禁用交互 |
| `loadingIcon` | `Component` | `Loading` | 自定义加载图标组件 |
| `circle` | `boolean` | — | 圆形按钮 |
| `disabled` | `boolean` | `false` | 禁用状态，阻止点击与波纹 |
| `icon` | `Component` | — | 图标组件，按 iconPosition 渲染 |
| `iconSize` | `number` | — | 图标大小（px） |
| `iconPosition` | `'left' \| 'right'` | `'left'` | 图标位置 |
| `propagate` | `boolean` | `true` | `false` 时阻止 click 事件冒泡 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `click` | `(e: MouseEvent)` | 点击事件，`disabled` 或 `loading` 时不触发 |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 按钮内文本/内容 |

## Exposed

```ts
interface ButtonExposed {
  el: HTMLButtonElement | undefined
}
```

## Examples

### 基础类型

```vue
<u-button>默认</u-button>
<u-button type="primary">主要</u-button>
<u-button type="success">成功</u-button>
<u-button type="warning">警告</u-button>
<u-button type="danger">危险</u-button>
<u-button type="info">信息</u-button>
```

### 尺寸

```vue
<u-button size="small" type="primary">小按钮</u-button>
<u-button size="default" type="primary">默认尺寸</u-button>
<u-button size="large" type="primary">大按钮</u-button>
```

### 朴素 / 文本 / 加载 / 禁用

```vue
<script setup>
import { Refresh } from '@veltra/icons/normal'
</script>

<template>
  <u-button plain type="primary">朴素按钮</u-button>
  <u-button plain type="primary" disabled>朴素禁用</u-button>

  <u-button text type="success">文本按钮</u-button>

  <u-button loading type="primary">加载中</u-button>
  <u-button loading type="primary" :loading-icon="Refresh">自定义加载图标</u-button>

  <u-button disabled type="danger">禁用</u-button>
</template>
```

### 圆形 + 图标

```vue
<template>
  <u-button type="primary" circle :icon="Edit" />
  <u-button type="success" circle :icon="Edit" />
</template>
```

### 图标位置 + 事件

```vue
<script setup>
import { Search } from '@veltra/icons/normal'

const handleClick = (e: MouseEvent) => {
  console.log('clicked', e)
}
</script>

<template>
  <u-button type="primary" :icon="Search" icon-position="right" @click="handleClick">
    搜索
  </u-button>
</template>
```

### 阻止冒泡

```vue
<div @click="handleOuter">
  <u-button type="primary" :propagate="false" @click="handleClick">
    不会冒泡到外层
  </u-button>
</div>
```

### 获取 DOM 引用

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { ButtonExposed } from '@veltra/desktop'

const btnRef = useTemplateRef<ButtonExposed>('btn')
// btnRef.value?.el → HTMLButtonElement | undefined
</script>

<template>
  <u-button ref="btn" type="primary">按钮</u-button>
</template>
```

---

# UButtonGroup — 按钮组

将多个按钮包裹为一个组合，通过 slot 作用域统一透传 props 给子按钮。

> `import type { ButtonProps } from '@veltra/desktop'`

## Import

```ts
// UButtonGroup 由 Vite 自动导入，无需手动 import
```

## Props

与 `UButton` 完全一致的 `ButtonProps`，用于统一控制组内按钮行为。

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ props: ButtonProps }` | 通过 `v-bind="props"` 将统一 props 透传给每个子按钮 |

## Examples

### 基础分组

```vue
<u-button-group v-slot="{ props }">
  <u-button v-bind="props" type="primary">上一页</u-button>
  <u-button v-bind="props" type="primary">下一页</u-button>
</u-button-group>
```

### 多按钮切换

```vue
<script setup>
import { bem } from '@veltra/utils'
import { shallowRef } from 'vue'

const buttons = [
  { type: 'primary' as const, text: '选项一' },
  { type: 'primary' as const, text: '选项二' },
  { type: 'primary' as const, text: '选项三' },
]
const active = shallowRef(0)
</script>

<template>
  <u-button-group v-slot="{ props }">
    <u-button
      v-for="(btn, index) in buttons"
      :key="index"
      v-bind="props"
      :class="bem.is('active', index === active)"
      @click="active = index"
    >
      {{ btn.text }}
    </u-button>
  </u-button-group>
</template>
```

### 统一禁用整组

```vue
<u-button-group disabled v-slot="{ props }">
  <u-button v-bind="props" type="primary">剪切</u-button>
  <u-button v-bind="props" type="primary">复制</u-button>
  <u-button v-bind="props" type="primary">粘贴</u-button>
</u-button-group>
```

### 统一尺寸

```vue
<u-button-group size="small" v-slot="{ props }">
  <u-button v-bind="props" type="primary">小</u-button>
  <u-button v-bind="props" type="primary">小</u-button>
</u-button-group>
```
