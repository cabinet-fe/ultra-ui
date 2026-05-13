# UPalette — 调色板

> `import type { PaletteProps, PaletteEmits, PaletteExposed } from '@veltra/desktop'`

基于浮层弹出（`UTip`）的颜色选择器，支持色相、饱和度/亮度、透明度调节，点击触发，内部集成 HEX(A) 输入校验。

## Import

```ts
// UPalette 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `string` | — | 当前颜色值，格式为 `#` 开头 HEX(A)，如 `#FF0000`、`#FF000080` |
| `size` | `ComponentSize` | — | 组件尺寸 |
| `tips` | `string` | — | 在表单控件内时的提示 |
| `span` | `number \| 'full' \| { default: number \| 'full'; xs?: number \| 'full'; sm?: number \| 'full'; md?: number \| 'full'; lg?: number \| 'full'; xl?: number \| 'full' }` | — | 所占列的大小 |
| `label` | `string` | — | 表单标签文字 |
| `field` | `string` | — | 表单项字段 |
| `disabled` | `boolean` | — | 是否禁用 |
| `readonly` | `boolean` | — | 是否只读 |

> `size`、`disabled`、`readonly` 在表单上下文（`UForm`）中会自动继承，运行时 fallback 分别为 `'default'`、`false`、`false`。

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: string)` | 颜色值变化时触发 |

## Slots

无。

## Exposed

```ts
interface PaletteExposed {
  // 无暴露方法/属性
}
```

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const color = ref('#FF0000')
</script>

<template>
  <u-palette v-model="color" />
</template>
```

### 禁用与只读

```vue
<template>
  <u-palette v-model="color1" disabled />
  <u-palette v-model="color2" readonly />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const color1 = ref('#409EFF')
const color2 = ref('#67C23A')
</script>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const model = reactive({
  themeColor: ''
})
</script>

<template>
  <u-form :model="model">
    <u-palette label="主题色" field="themeColor" v-model="model.themeColor" />
  </u-form>
</template>
```

### 带透明度的颜色

```vue
<script setup lang="ts">
import { ref } from 'vue'

const color = ref('#FF000080')
</script>

<template>
  <u-palette v-model="color" />
</template>
```
