# UNumberInput — 数字输入框

> `import type { NumberInputProps, NumberInputEmits, NumberInputExposed } from '@veltra/desktop'`

数字输入组件，基于 `UInput` 封装，支持精度控制、货币格式化、步进按钮、上下键调整、倍数模式。内部使用 `@cat-kit/core`（`$n`）进行高精度数值运算，步进时带 Tween 动画。`readonly` 时为纯文本展示。

## Import

```ts
// UNumberInput 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `number` | — | 绑定值 |
| `currency` | `boolean` | — | 是否为货币模式，启用后按 `CNY` 格式化显示（如 `¥1,234.56`） |
| `precision` | `number` | — | 固定精度（小数位数）。设置后 `minPrecision` / `maxPrecision` 无效 |
| `minPrecision` | `number` | — | 最小精度。未设 `precision` 且值为整数时不补零 |
| `maxPrecision` | `number` | — | 最大精度。默认取 `modelValue` 与 `step` 小数位数的较大值 |
| `step` | `boolean \| number` | — | 步进值，设为数字时显示步进按钮并以该值为步长，设为 `true` 时步长为 `1` |
| `max` | `number` | — | 最大值，超出时自动修正 |
| `min` | `number` | — | 最小值，超出时自动修正 |
| `multiple` | `number` | — | 倍数。显示时除以倍数、内部存储时乘以倍数（例如分↔元转换：`multiple=100`） |
| `placeholder` | `string` | `'请输入'` | 占位符（继承自 `InputProps`） |
| `prefix` | `string` | — | 前缀文本，显示在输入值左侧（继承自 `InputProps`） |
| `suffix` | `string` | — | 后缀文本，显示在输入值右侧（继承自 `InputProps`） |
| `clearable` | `boolean` | `true` | 是否可清除（hover 且有值时在 suffix 区显示清除图标）（继承自 `InputProps`） |
| `nativeReadonly` | `boolean` | — | 原生只读（保留输入框外观，设置 `<input readonly>`）（继承自 `InputProps`） |
| `pattern` | `RegExp` | — | 正则校验（继承自 `InputProps`） |
| `size` | `ComponentSize` | `'default'` | 尺寸（继承自 `ComponentProps`，回退到表单上下文 → 全局配置 → `'default'`） |
| `disabled` | `boolean` | `false` | 禁用（继承自 `FormComponentProps`，回退到表单上下文 → 全局配置 → `false`） |
| `readonly` | `boolean` | `false` | 只读（继承自 `FormComponentProps`，回退到表单上下文 → 全局配置 → `false`）。开启后输入框隐藏，显示格式化后的纯文本。 |
| `label` | `string` | — | 表单标签文字（继承自 `FormComponentProps`） |
| `field` | `string` | — | 表单项字段（继承自 `FormComponentProps`） |
| `tips` | `string` | — | 表单控件内的提示信息（继承自 `FormComponentProps`） |
| `span` | `number \| 'full' \| { default: number \| 'full'; xs?: number \| 'full'; sm?: number \| 'full'; md?: number \| 'full'; lg?: number \| 'full'; xl?: number \| 'full' }` | — | 所占列大小（继承自 `FormComponentProps`） |

> `size`、`disabled`、`readonly` 在表单上下文（`UForm`）中会自动继承。当设置 `multiple` 后，`min`/`max`/`step` 等校验均基于除以倍数后的原始值进行，`modelValue` 存储乘以倍数后的实际值。

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value?: number)` | 值变化时触发，input 输入时实时更新，步进按钮点击后即时触发 |
| `change` | `(value?: number)` | 失焦时触发确认 |
| `clear` | `()` | 点击清除按钮时触发 |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `prefix` | — | 前缀插槽，可与 `prefix` prop 文本同时渲染 |
| `suffix` | — | 后缀插槽，可与 `suffix` prop 文本同时渲染 |

## Exposed

```ts
interface NumberInputExposed {}
```

当前无暴露属性或方法。

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const num = ref<number>()
</script>

<template>
  <u-number-input v-model="num" :min="0" :max="100" placeholder="请输入数字" />
</template>
```

### 货币模式

```vue
<script setup lang="ts">
import { ref } from 'vue'

const price = ref(1234.5)
</script>

<template>
  <u-number-input v-model="price" currency :precision="2" />
</template>
```

### 步进按钮

设置 `step` 后显示上下步进按钮，支持键盘 ArrowUp / ArrowDown 操作。`max`/`min` 边界时按钮自动禁用。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(5)
</script>

<template>
  <u-number-input v-model="count" :step="1" :min="0" :max="10" />
</template>
```

### 精度控制

```vue
<script setup lang="ts">
import { ref } from 'vue'

const weight = ref<number>()
</script>

<template>
  <!-- 固定在两位小数 -->
  <u-number-input v-model="weight" :precision="2" placeholder="请输入重量" />

  <!-- 最少两位、最多四位小数 -->
  <u-number-input v-model="weight" :min-precision="2" :max-precision="4" />
</template>
```

### 倍数模式（分↔元）

`modelValue` 以分存储，显示时自动转换为元。

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 内部以"分"为单位存储 12345 → 显示 ¥123.45
const amountInCents = ref(12345)
</script>

<template>
  <u-number-input v-model="amountInCents" currency :multiple="100" :step="100" />
</template>
```

### 在 UForm 中使用

`disabled`、`readonly`、`size` 会从表单上下文继承。

```vue
<script setup lang="ts">
import { FormModel } from '@veltra/desktop'

const model = new FormModel({
  quantity: 0,
  price: 0
})
</script>

<template>
  <u-form :model="model">
    <u-number-input field="quantity" label="数量" :min="0" :step="1" />
    <u-number-input field="price" label="单价" currency :precision="2" :step="0.01" />
  </u-form>
</template>
```
