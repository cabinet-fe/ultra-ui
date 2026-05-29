# UButton / UButtonGroup — 按钮

> `import type { ButtonProps, ButtonExposed } from '@veltra/desktop'`

通用按钮组件，支持语义颜色、尺寸、图标、加载态、朴素/文本模式，内置波纹指令。`UButtonGroup` 通过 slot 作用域统一透传 props 给子按钮。

## Import

```ts
// UButton、UButtonGroup 由 Vite 自动导入，无需手动 import
```

## UButton Props

| prop           | type                | default     | 说明                                                        |
| -------------- | ------------------- | ----------- | ----------------------------------------------------------- |
| `type`         | `ColorType`         | —           | `'primary' \| 'info' \| 'success' \| 'warning' \| 'danger'` |
| `size`         | `ComponentSize`     | `'default'` | `'small' \| 'default' \| 'large'`                           |
| `text`         | `boolean`           | —           | 文本模式（无背景无边框）                                    |
| `plain`        | `boolean`           | —           | 朴素模式（边框 + 文字使用 type 色）                         |
| `loading`      | `boolean`           | —           | 加载中（显示 loadingIcon 并禁用交互）                       |
| `loadingIcon`  | `Component`         | `Loading`   | 自定义加载图标                                              |
| `circle`       | `boolean`           | —           | 圆形                                                        |
| `disabled`     | `boolean`           | `false`     | 禁用                                                        |
| `icon`         | `Component`         | —           | 图标组件                                                    |
| `iconSize`     | `number`            | —           | 图标大小（px）                                              |
| `iconPosition` | `'left' \| 'right'` | `'left'`    | 图标位置                                                    |
| `propagate`    | `boolean`           | `true`      | `false` 时阻止 click 冒泡                                   |

## UButton Emits

| event   | 参数              | 说明                                     |
| ------- | ----------------- | ---------------------------------------- |
| `click` | `(e: MouseEvent)` | 点击（`disabled` 或 `loading` 时不触发） |

## UButton Slots

| slot      | 说明     |
| --------- | -------- |
| `default` | 按钮内容 |

## UButton Exposed

```ts
interface ButtonExposed {
  el: HTMLButtonElement | undefined
}
```

## UButtonGroup

Props 与 `ButtonProps` 完全一致（用于统一控制组内所有按钮）。

| slot      | 作用域                   | 说明                                   |
| --------- | ------------------------ | -------------------------------------- |
| `default` | `{ props: ButtonProps }` | 通过 `v-bind="props"` 透传给每个子按钮 |

## Examples

### 颜色 / 尺寸 / 模式

```vue
<u-button>默认</u-button>
<u-button type="primary">主要</u-button>
<u-button type="success">成功</u-button>
<u-button type="warning">警告</u-button>
<u-button type="danger">危险</u-button>

<u-button size="small" type="primary">小</u-button>
<u-button size="large" type="primary">大</u-button>

<u-button plain type="primary">朴素</u-button>
<u-button text type="success">文本</u-button>
<u-button loading type="primary">加载中</u-button>
<u-button disabled type="danger">禁用</u-button>
```

### 图标 / 圆形 / 自定义加载图标

```vue
<script setup>
import { Search, Edit, Refresh } from '@veltra/icons/normal'
</script>

<template>
  <u-button type="primary" :icon="Search">搜索</u-button>
  <u-button type="primary" :icon="Search" icon-position="right">搜索</u-button>
  <u-button type="primary" circle :icon="Edit" />
  <u-button loading type="primary" :loading-icon="Refresh">刷新</u-button>
</template>
```

### 阻止冒泡 / 获取 DOM

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { ButtonExposed } from '@veltra/desktop'

const btnRef = useTemplateRef<ButtonExposed>('btn')
// btnRef.value?.el → HTMLButtonElement
</script>

<template>
  <div @click="handleOuter">
    <u-button ref="btn" type="primary" :propagate="false" @click="handleClick">
      不冒泡到外层
    </u-button>
  </div>
</template>
```

### UButtonGroup — 统一 props 透传

```vue
<u-button-group v-slot="{ props }" size="small" disabled>
  <u-button v-bind="props" type="primary">剪切</u-button>
  <u-button v-bind="props" type="primary">复制</u-button>
  <u-button v-bind="props" type="primary">粘贴</u-button>
</u-button-group>
```

```vue
<script setup>
import { shallowRef } from 'vue'
import { bem } from '@veltra/utils'

const buttons = [
  { type: 'primary' as const, text: '选项一' },
  { type: 'primary' as const, text: '选项二' }
]
const active = shallowRef(0)
const cls = bem('button')
</script>

<template>
  <u-button-group v-slot="{ props }">
    <u-button
      v-for="(btn, i) in buttons"
      :key="i"
      v-bind="props"
      :class="cls.is('active', i === active)"
      @click="active = i"
    >
      {{ btn.text }}
    </u-button>
  </u-button-group>
</template>
```
