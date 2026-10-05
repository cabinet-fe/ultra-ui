---
title: 'UNumberInput 数字输入框（移动端）'
description: '从 `@veltra/mobile` 导出的数字输入框：`inputmode="decimal"` 固定弹出数字键盘，步进按钮外置输入框右侧且各 44×44 触控热区；支持货币/精度格式化、min-max 边界钳制、multiple 倍数换算（分↔元），在 UForm 内用 field 绑定与 rules 校验。'
aliases: [NumberInput, number-input, 移动端数字输入框, InputNumber, 金额输入框, 数字键盘]
keywords:
  [
    modelValue,
    currency,
    precision,
    minPrecision,
    maxPrecision,
    step,
    multiple,
    clearable,
    field,
    rules,
    inputmode,
    'update:modelValue',
    移动端数字输入框,
    步进按钮,
    数字键盘,
    货币,
    千分位,
    数值范围,
    金额输入,
    表单校验
  ]
---

# UNumberInput 数字输入框（移动端）

`@veltra/mobile` 导出数字输入框组件 `UNumberInput`。基于移动端 `UInput` 实现，`modelValue` 为 `number | undefined`；支持 `precision` / `minPrecision` / `maxPrecision` 小数位控制、`currency` 货币格式化（CNY）、`min` / `max` 边界钳制、`step` 步进、`multiple` 倍数换算（如以「分」存储、按「元」显示）。API 与 `@veltra/desktop` 的 `UNumberInput` 同名同默认值，交互形态按触屏适配。

## 快速上手

```vue
<script setup lang="ts">
import { UNumberInput } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/number-input/style'

const count = shallowRef<number | undefined>()
</script>

<template>
  <!-- 输入 500 失焦后 count 为 500；输入 200 被立即钳制为 100 -->
  <u-number-input v-model="count" :min="0" :max="100" :step="1" />
  <p>当前值：{{ count ?? '未输入' }}</p>
</template>
```

独立使用走 `v-model`；放进 `<u-form>` 时用 `field` 绑定 model 字段，**有 `field` 就不要再写 `v-model`**。视觉初始化前提：入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`。

## API 签名

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** 预设校验规则（rules.preset 取值） */
export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

/** 字段校验规则（UForm / UFormItem 的 rules） */
export interface ValidateRule {
  /** 是否必填。true 用默认文案「该项不能为空」，字符串为自定义文案 */
  required?: boolean | string
  /** 长度；声明于类型，当前校验实现未读取 */
  length?: number | [number, string]
  /** 最小值。[min, 文案]；值须为 number */
  min?: number | [number, string]
  /** 最大值。[max, 文案]；值须为 number */
  max?: number | [number, string]
  /** 最小长度。[minLen, 文案]；值须为 string 或数组 */
  minLen?: number | [number, string]
  /** 最大长度。[maxLen, 文案]；值须为 string 或数组 */
  maxLen?: number | [number, string]
  /** 正则匹配。字符串按正则源 new RegExp(rule) 处理；值须为 string */
  match?: RegExp | [RegExp, string] | string
  /** 预设规则；取值 email / phone / num / url / idCard */
  preset?: PresetRule
  /** 自定义校验；返回非空字符串为错误文案，支持 Promise */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

/** 表单组件通用属性（label / rules 等仅 UForm 或 UFormItem 内生效） */
export interface FormComponentProps extends ComponentProps {
  /** 表单项提示，仅表单内生效 */
  tips?: string
  /** 所占列的大小；对象形态必须含 default 键 */
  span?:
    number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字 */
  label?: string
  /** UForm 内绑定 model 字段的路径 */
  field?: string
  /** 是否禁用；未传时继承 UForm 的 disabled */
  disabled?: boolean
  /** 是否只读；未传时继承 UForm 的 readonly，只读渲染为文本 */
  readonly?: boolean
  /** 校验规则，见 ValidateRule */
  rules?: ValidateRule
}

/** 输入框属性（UNumberInput 继承除 modelValue 外的全部属性） */
export interface InputProps extends FormComponentProps {
  modelValue?: string
  /** 占位符。默认 '请输入' */
  placeholder?: string
  /** 前缀文案；只读态拼在文本前 */
  prefix?: string
  /** 后缀文案；与 #suffix 插槽并存 */
  suffix?: string
  /** 是否可清除。默认 true */
  clearable?: boolean
  /** 原生只读；本组件未透传到内部输入框，写了无效果 */
  nativeReadonly?: boolean
  /** 输入模式；本组件未透传到内部输入框，写了无效果 */
  pattern?: RegExp
}

/** 数字输入组件属性（与 @veltra/desktop UNumberInput 对齐） */
export interface NumberInputProps extends Omit<InputProps, 'modelValue'> {
  /** 输入值。默认 undefined；清除后为 undefined */
  modelValue?: number
  /** 货币模式，按 CNY 格式化（¥ + 千分位）。默认 false */
  currency?: boolean
  /** 固定小数位；与 minPrecision / maxPrecision 同时给出时优先生效；聚焦时按它修正值 */
  precision?: number
  /** 最小小数位 */
  minPrecision?: number
  /** 最大小数位；未传时取「当前值与步长中最大的小数位数」 */
  maxPrecision?: number
  /** 步进。数字：显示加减按钮且为步长；true：按钮 + 步长 1；false / 不传：无按钮、无方向键 */
  step?: boolean | number
  /** 最大值；越界钳制到 max。作用对象为除以 multiple 后的值 */
  max?: number
  /** 最小值；越界钳制到 min。作用对象为除以 multiple 后的值 */
  min?: number
  /** 倍数。modelValue = 显示值 × multiple（如 multiple=100 存「分」显「元」） */
  multiple?: number
}

/** 数字输入组件事件 */
export interface NumberInputEmits {
  (event: 'update:modelValue', value?: number): void
  (event: 'change', value?: number): void
  (event: 'clear'): void
}

/** 暴露成员；为空，模板 ref 上无可访问成员 */
export interface NumberInputExposed {}
```

## 参数说明

| 参数             | 类型                              | 默认                 | 必填 | 约束                                                                                                                                   |
| ---------------- | --------------------------------- | -------------------- | :--: | -------------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`     | `number \| undefined`             | —                    |  否  | 输入值；点击清除后变为 `undefined`                                                                                                     |
| `currency`       | `boolean`                         | `false`              |  否  | CNY 货币格式（`¥` + 千分位）；仅失焦后格式化显示，聚焦编辑时显示纯数字                                                                 |
| `precision`      | `number`                          | —                    |  否  | 固定小数位；优先于 `minPrecision` / `maxPrecision`；聚焦时把值修正到该精度                                                             |
| `minPrecision`   | `number`                          | —                    |  否  | 最小小数位，不足补 0                                                                                                                   |
| `maxPrecision`   | `number`                          | 值与步长的最大小数位 |  否  | 最大小数位                                                                                                                             |
| `step`           | `boolean \| number`               | —                    |  否  | 数字 = 开启加减按钮且为步长；`true` = 按钮 + 步长 1；`false` / 不传 = 无按钮、无方向键。步长为 1 时直接更新，大于 1 时播放数字滚动动画 |
| `min`            | `number`                          | —                    |  否  | 下限；输入与步进越界立即钳制到 `min`                                                                                                   |
| `max`            | `number`                          | —                    |  否  | 上限；输入与步进越界立即钳制到 `max`                                                                                                   |
| `multiple`       | `number`                          | —                    |  否  | `modelValue` = 显示值 × `multiple`；`min` / `max` / `step` 均作用于除以 `multiple` 后的显示值                                          |
| `placeholder`    | `string`                          | `'请输入'`           |  否  | —                                                                                                                                      |
| `prefix`         | `string`                          | —                    |  否  | 输入框前缀文案                                                                                                                         |
| `suffix`         | `string`                          | —                    |  否  | 后缀文案，与 `#suffix` 插槽同时渲染                                                                                                    |
| `clearable`      | `boolean`                         | `true`               |  否  | 非禁用且有值时显示清除按钮（移动端常显）；点击置 `undefined` 并触发 `clear`                                                            |
| `size`           | `'small' \| 'default' \| 'large'` | `'default'`          |  否  | 未传时继承 `UForm` 的 `size`                                                                                                           |
| `disabled`       | `boolean`                         | `false`              |  否  | 未传时继承 `UForm` 的 `disabled`；禁用步进按钮与清除                                                                                   |
| `readonly`       | `boolean`                         | `false`              |  否  | 未传时继承 `UForm` 的 `readonly`；只读渲染为文本（空值显示 `-`）                                                                       |
| `field`          | `string`                          | —                    |  否  | 仅 `UForm` 内生效；声明后由 `UForm` 按 `field` 路径读写 model                                                                          |
| `label`          | `string`                          | —                    |  否  | 仅 `UForm` / `UFormItem` 内生效                                                                                                        |
| `rules`          | `ValidateRule`                    | —                    |  否  | 仅 `UForm` / `UFormItem` 内生效，完整结构见「API 签名」                                                                                |
| `tips`           | `string`                          | —                    |  否  | 仅 `UForm` / `UFormItem` 内生效                                                                                                        |
| `span`           | `number \| 'full' \| 对象`        | —                    |  否  | 栅格列宽，仅 `UForm` / `UFormItem` 内生效                                                                                              |
| `nativeReadonly` | `boolean`                         | —                    |  否  | 未透传到内部输入框，无效果                                                                                                             |
| `pattern`        | `RegExp`                          | —                    |  否  | 未透传到内部输入框，无效果                                                                                                             |

## 方法与事件

事件：

- `update:modelValue(value?: number)` — 每次键入解析成功、点击加减按钮、点击清除时触发。
- `change(value?: number)` — **仅在输入框失焦时**触发一次，参数为当前值。聚焦时按 `precision` 修正值，失焦后格式化显示。
- `clear` — 点击清除按钮时触发，`modelValue` 已置为 `undefined`。

键盘：设置 `step` 后，聚焦时按 `ArrowUp` 触发加、`ArrowDown` 触发减；未设置 `step` 时方向键无效果。`min` / `max` 会在输入与步进时**立即**把值钳制到边界（不是报错）。

暴露：`NumberInputExposed` 为空接口，模板 `ref` 上无可访问成员。组件仅声明上述三个事件，`focus` / `blur` 不在事件声明中。

## 典型示例

### 精度与货币格式化

```vue
<script setup lang="ts">
import { UNumberInput } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/number-input/style'

const weight = shallowRef<number | undefined>(1.5)
const price = shallowRef<number | undefined>(1234567.891)
</script>

<template>
  <!-- 固定 2 位小数：失焦后显示 1.50，modelValue 保持 1.5 -->
  <u-number-input v-model="weight" :precision="2" suffix="kg" />
  <!-- 最少 2 位、最多 4 位小数：输入 1.23456 失焦后收敛为 1.2346 -->
  <u-number-input v-model="weight" :min-precision="2" :max-precision="4" />
  <!-- 货币：失焦后显示 ¥1,234,567.89，modelValue 为 1234567.89 -->
  <u-number-input v-model="price" currency :precision="2" />
</template>
```

### 外置步进按钮与倍数换算

```vue
<script setup lang="ts">
import { UNumberInput } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/number-input/style'

const count = shallowRef<number | undefined>(8)
// 以「分」为单位的金额：12345 显示为 ¥123.45
const cents = shallowRef<number | undefined>(12345)
</script>

<template>
  <!-- 加减按钮外置输入框右侧、各 44×44；步长 5；聚焦后 ArrowUp / ArrowDown 同样生效；越界钳到 [0, 20] -->
  <u-number-input v-model="count" :step="5" :min="0" :max="20" />
  <!-- 倍数模式：存储「分」、显示「元」；step=1 表示原始值（元）+1，存储值 +100 -->
  <u-number-input v-model="cents" currency :multiple="100" :step="1" :precision="2" />
</template>
```

### 在 UForm 中用 field 绑定与 rules 校验

```vue
<script setup lang="ts">
import { UButton, UForm, UNumberInput } from '@veltra/mobile'
import { reactive, shallowRef } from 'vue'
import '@veltra/mobile/components/number-input/style'
import type { FormExposed } from '@veltra/mobile'

const formRef = shallowRef<FormExposed>()
const formData = reactive({ age: 18, price: 0 })

function checkAge(value: any) {
  if (value < 18) return '年龄不能小于 18'
  return ''
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (valid) console.log('提交', formData) // => 校验通过后的 formData
}
</script>

<template>
  <u-form ref="formRef" :model="formData">
    <u-number-input
      label="年龄"
      field="age"
      :min="0"
      :max="150"
      :step="1"
      :rules="{ required: true, validator: checkAge }"
    />
    <u-number-input label="单价" field="price" currency :precision="2" :rules="{ min: 0 }" />
  </u-form>
  <u-button type="primary" @click="handleSubmit">提交</u-button>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是步进按钮（`-` / `+`）外置在输入框右侧、各 44×44 触控热区，桌面端是输入框后缀内的上下箭头图标；开关步进按钮的属性都是 `step`，不是 Element `el-input-number` 的 `controls`，本库没有 `controls` 属性。
> - 移动端是内部 `<input>` 固定 `inputmode="decimal"` 弹出数字键盘，用户传入的 `inputmode` 会被覆盖；桌面端无此设置。`enterkeyhint` / `maxlength` 等其余透传属性经内部 `UInput` 继续落到原生 `<input>` 上。
> - 移动端是清除按钮有输入即常显，桌面端是悬停显示；清除按钮最小宽度 44px 且撑满输入行高度。
> - 移动端密度取 `--um-*` token：输入行继承 `UInput` 的 `max(--um-control-height-*, --um-touch-target)` 高度与 `--um-font-size-main`（16px，防 iOS 聚焦缩放），步进按钮圆角 `--um-control-radius-default`。
> - 嵌入 `UFormItem` 控件区后占满控件区，步进与清除按钮热区仍各 44px，步进按钮转透明形态（去边框）。
> - `UForm` 内用 `field` 绑定 model，**禁止**再写 `v-model`，两者并用以 `v-model` 为准并产生两份状态；独立于 `UForm` 使用时才走 `v-model`。
> - `min` / `max` 是**即时钳制**（输入越界立即改值），不产生校验提示；要「允许输入但校验报错」用 `rules` 的 `min` / `max`。
> - `min` / `max` / `step` 作用于除以 `multiple` 后的值；`modelValue` 是乘回 `multiple` 后的实际值。
> - 聚焦编辑时显示纯数字，失焦后才按 `currency` / `precision` 格式化（货币符号、千分位、补零）；解析输入时自动去掉千分位逗号。
> - `precision` 与 `minPrecision` / `maxPrecision` 同时给出时，`precision` 优先。
> - `pattern` 与 `nativeReadonly` 继承自 `InputProps`，但本组件未把它们透传给内部 `UInput`，写了无效果。
> - 只声明 `update:modelValue` / `change` / `clear` 三个事件；`change` 仅失焦触发，监听实时变化用 `update:modelValue`（即 `v-model`）。
> - 只写 `:model-value` 不监听更新时，失焦会回到旧值；必须用 `v-model` 或 `field`。
> - 按需引入样式必须走 `import '@veltra/mobile/components/number-input/style'`；独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`。

## 常见问题

### 输入 999（设了 `:max="100"`）输入框立刻变成 100

这是 `max` 的即时钳制行为，不是 bug。需要「输入自由、提交时校验」时去掉 `max`，改用规则：

```vue
<u-number-input label="数量" field="qty" :rules="{ max: [100, '数量不能超过 100'] }" />
```

### 绑定值在失焦后被改回旧值

原因：只传了 `:model-value` 而没有监听 `update:modelValue`，失焦时组件会把内部值同步回 prop。修复：改用 `v-model`（独立使用）或 `field`（`UForm` 内）。

### 软键盘不是数字键盘

原因：内部 `<input>` 的 `inputmode` 由组件固定为 `decimal`，用户无法覆盖，弹出的是含小数点的数字键盘。禁止通过传 `inputmode` 试图改成别的键盘形态；只允许输入整数的约束用 `:precision="0"` 表达。
