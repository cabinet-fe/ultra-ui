# USlider — 滑块

> `import type { SliderProps, SliderEmits, SliderExposed } from '@veltra/desktop'`

通过拖动滑块或点击滑轨在数值范围内进行选择，支持范围选择、步长与垂直模式。

## Import

```ts
// USlider 由 Vite 自动导入，无需手动 import
```

## Props

| prop         | type                                                                                                                                                                   | default     | 说明                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------ |
| `modelValue` | `number \| [number, number]`                                                                                                                                           | —           | 绑定值，`range` 时传入 `[min, max]`        |
| `min`        | `number`                                                                                                                                                               | `0`         | 最小值                                     |
| `max`        | `number`                                                                                                                                                               | `100`       | 最大值                                     |
| `step`       | `number`                                                                                                                                                               | —           | 步长，设置后滑块吸附到步长刻度并显示刻度点 |
| `range`      | `boolean`                                                                                                                                                              | —           | 是否为范围选择（两个滑块 thumb）           |
| `vertical`   | `boolean`                                                                                                                                                              | —           | 是否为垂直模式                             |
| `size`       | `ComponentSize`                                                                                                                                                        | `'default'` | 组件尺寸                                   |
| `disabled`   | `boolean`                                                                                                                                                              | `false`     | 是否禁用                                   |
| `readonly`   | `boolean`                                                                                                                                                              | `false`     | 是否只读（只读时显示纯文本当前值）         |
| `tips`       | `string`                                                                                                                                                               | —           | 在表单控件内时的提示                       |
| `span`       | `number \| 'full' \| { default: number \| 'full'; xs?: number \| 'full'; sm?: number \| 'full'; md?: number \| 'full'; lg?: number \| 'full'; xl?: number \| 'full' }` | —           | 所占列的大小                               |
| `label`      | `string`                                                                                                                                                               | —           | 表单标签文字                               |
| `field`      | `string`                                                                                                                                                               | —           | 表单项字段                                 |

> `size`、`disabled`、`readonly` 在表单上下文（`UForm`）中会自动继承，运行时 fallback 分别为 `'default'`、`false`、`false`。

## Emits

| event               | 参数                                  | 说明                                              |
| ------------------- | ------------------------------------- | ------------------------------------------------- |
| `update:modelValue` | `(value: number \| [number, number])` | 值变化时触发，`range` 时传出排序后的 `[min, max]` |

## Exposed

```ts
interface SliderExposed {}
```

当前无暴露属性或方法。

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const value = ref(50)
</script>

<template>
  <u-slider v-model="value" />
</template>
```

### 范围选择

```vue
<script setup lang="ts">
import { ref } from 'vue'

const range = ref<[number, number]>([20, 80])
</script>

<template>
  <u-slider v-model="range" range />
</template>
```

### 设置步长

```vue
<template>
  <u-slider v-model="value" :step="10" />
</template>
```

### 垂直模式

```vue
<template>
  <u-slider v-model="value" vertical />
</template>
```

### 禁用 / 只读

```vue
<template>
  <u-slider v-model="value" disabled />
  <u-slider v-model="value" readonly />
</template>
```

### 在 UForm 中使用

> 参考 [form.md](form.md) 了解 FormModel 的完整用法。`disabled`、`readonly`、`size` 会从表单上下文继承。

```vue
<script setup lang="ts">
import { FormModel, formField } from '@veltra/desktop'

const model = new FormModel({ volume: formField({ value: 30 }) })
</script>

<template>
  <u-form :model="model">
    <u-slider field="volume" label="音量" />
  </u-form>
</template>
```

### 点击滑轨调整

`range` 模式下点击滑轨不生效，仅通过拖动 thumb 调整。非 `range` 模式下点击滑轨任意位置可快速跳转。

```vue
<template>
  <!-- 点击滑轨可直接跳转 -->
  <u-slider v-model="value" />

  <!-- 范围模式只能拖 thumb，点击滑轨不生效 -->
  <u-slider v-model="range" range />
</template>
```
