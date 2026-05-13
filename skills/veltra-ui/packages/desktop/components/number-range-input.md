# UNumberRangeInput — 数字范围输入框

> `import type { NumberRangeInputProps, NumberRangeInputEmits, NumberRangeInputExposed } from '@veltra/desktop'`

数字范围输入组件，由两个 `UNumberInput` 组成（起始值 + 结束值），中间以分隔符连接。支持双向绑定 `v-model`（`[start, end]` 元组），也可通过 `v-model:start` / `v-model:end` 分别绑定。内部自动保证 start ≤ end。`readonly` 时显示为格式化纯文本。

## Import

```ts
import { UNumberRangeInput } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `[number \| undefined, number \| undefined]` | `[undefined, undefined]` | 绑定值，元组 `[起始值, 结束值]` |
| `start` | `number` | — | 起始值，支持 `v-model:start` 分别绑定 |
| `end` | `number` | — | 结束值，支持 `v-model:end` 分别绑定 |
| `startPlaceholder` | `string` | `'请输入'` | 起始输入框占位文本 |
| `endPlaceholder` | `string` | `'请输入'` | 结束输入框占位文本 |
| `separator` | `string` | `'~'` | 中间分隔文案，显示在两个输入框之间 |
| `currency` | `boolean` | — | 货币模式，启用后按 `CNY` 格式化显示（如 `¥1,234.56`） |
| `precision` | `number` | — | 固定精度（小数位数），设置后 `minPrecision` / `maxPrecision` 无效 |
| `minPrecision` | `number` | — | 最小精度，未设 `precision` 且值为整数时不补零 |
| `maxPrecision` | `number` | — | 最大精度 |
| `step` | `boolean \| number` | — | 步进值，设为数字时显示步进按钮并以该值为步长，设为 `true` 时步长为 `1` |
| `max` | `number` | — | 最大值，超出时自动修正 |
| `min` | `number` | — | 最小值，超出时自动修正 |
| `multiple` | `number` | — | 倍数，显示时除以倍数、内部存储时乘以倍数（例如分↔元转换：`multiple=100`） |
| `prefix` | `string` | — | 前缀文本，显示在输入值左侧 |
| `suffix` | `string` | — | 后缀文本，显示在输入值右侧 |
| `clearable` | `boolean` | `true` | 是否可清除（hover 且有值时显示清除图标） |
| `nativeReadonly` | `boolean` | — | 原生只读（保留输入框外观，设置 `<input readonly>`） |
| `pattern` | `RegExp` | — | 正则校验 |
| `size` | `ComponentSize` | `'default'` | 尺寸（回退到表单上下文 → 全局配置 → `'default'`） |
| `disabled` | `boolean` | `false` | 禁用（回退到表单上下文 → 全局配置 → `false`） |
| `readonly` | `boolean` | `false` | 只读（回退到表单上下文 → 全局配置 → `false`），开启后输入框隐藏，显示格式化纯文本 |
| `label` | `string` | — | 表单标签文字 |
| `field` | `string` | — | 表单项字段 |
| `tips` | `string` | — | 表单控件内的提示信息 |
| `span` | `number \| 'full' \| { default: number \| 'full'; xs?: number \| 'full'; sm?: number \| 'full'; md?: number \| 'full'; lg?: number \| 'full'; xl?: number \| 'full' }` | — | 所占列大小 |

> `size`、`disabled`、`readonly` 在表单上下文（`UForm`）中会自动继承。当设置 `multiple` 后，`min`/`max`/`step` 等校验均基于除以倍数后的原始值进行，`modelValue` 存储乘以倍数后的实际值。

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value: [number \| undefined, number \| undefined])` | `v-model` 值变化时触发 |
| `update:start` | `(value: number \| undefined)` | `v-model:start` 值变化时触发 |
| `update:end` | `(value: number \| undefined)` | `v-model:end` 值变化时触发 |
| `change` | `(value: [number \| undefined, number \| undefined])` | 任一输入框失焦时触发确认 |

## Slots

无插槽。

## Exposed

```ts
interface NumberRangeInputExposed {}
```

当前无暴露属性或方法。

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const range = ref<[number | undefined, number | undefined]>([10, 50])
</script>

<template>
  <u-number-range-input v-model="range" :min="0" :max="100" />
</template>
```

### 分别绑定 start / end

```vue
<script setup lang="ts">
import { ref } from 'vue'

const start = ref<number>()
const end = ref<number>()
</script>

<template>
  <u-number-range-input v-model:start="start" v-model:end="end" start-placeholder="最低价" end-placeholder="最高价" separator="至" />
</template>
```

### 货币模式 + 倍数

`modelValue` 以分存储，显示时自动转换为元。

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 内部以"分"为单位存储，显示 ¥100.00 ~ ¥500.00
const priceRange = ref<[number | undefined, number | undefined]>([10000, 50000])
</script>

<template>
  <u-number-range-input v-model="priceRange" currency :multiple="100" :precision="2" :step="100" />
</template>
```

### 在 UForm 中使用

`disabled`、`readonly`、`size` 会从表单上下文继承。

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({
  priceRange: [0, 1000] as [number | undefined, number | undefined]
})
</script>

<template>
  <u-form :model="form">
    <u-number-range-input field="priceRange" label="价格区间" currency :precision="2" />
  </u-form>
</template>
```
