---
title: UNumberRangeInput 数字范围输入框
description: "数字区间输入框：modelValue 为 [起始, 结束] 元组，支持 v-model:start / v-model:end 分侧绑定、失焦时起止越界自动校正、货币/精度/步进/倍数（继承 UNumberInput），以及在 UForm 内用 field 绑定。"
aliases: [NumberRangeInput, number-range-input, 数字区间输入框, 区间输入框, InputNumberRange, 价格区间输入]
keywords:
  - modelValue
  - NumberRangeTuple
  - v-model:start
  - v-model:end
  - startPlaceholder
  - endPlaceholder
  - separator
  - currency
  - precision
  - step
  - multiple
  - change
  - field
  - rules
  - 区间输入
  - 价格区间
  - 起止范围
  - 越界校正
  - 双端联动
---

# UNumberRangeInput 数字范围输入框

`@veltra/desktop` 导出数字范围输入框组件 `UNumberRangeInput`。内部由两个 `UNumberInput` 组成，`modelValue` 是二元元组 `[起始, 结束]`（`NumberRangeTuple`），也可用 `v-model:start` / `v-model:end` 分侧绑定；任一侧失焦时对起止顺序做自动校正；`currency` / `precision` / `step` / `min` / `max` / `multiple` 等属性继承 `UNumberInput` 并同时作用于两端。

## 快速上手

独立使用走 `v-model`（元组）；放进 `UForm` 时用 `field` 绑定 model 字段，**有 `field` 就不要再写 `v-model`**。独立成页需先初始化主题（`import '@veltra/styles/normalize'` + `loadTheme()`），SFC 片段场景无需重复。

```vue
<script setup lang="ts">
import type { NumberRangeTuple } from '@veltra/desktop'
import { UNumberRangeInput } from '@veltra/desktop'
import { shallowRef } from 'vue'

const range = shallowRef<NumberRangeTuple>([10, 80])
</script>

<template>
  <!-- min / max / step 对左右两个输入框各自生效 -->
  <u-number-range-input v-model="range" :min="0" :max="100" style="width: 300px" />
  <p>当前值：{{ range[0] }} ~ {{ range[1] }}</p>
</template>
```

## API 签名

```ts
import type { NumberInputProps } from '@veltra/desktop'

/** 数字范围 [起始, 结束]；modelValue 的类型 */
export type NumberRangeTuple = [number | undefined, number | undefined]

/** 数字范围输入组件属性；继承 UNumberInput 除 modelValue / placeholder 外的全部属性 */
export interface NumberRangeInputProps
  extends Omit<NumberInputProps, 'modelValue' | 'placeholder'> {
  /** 范围值。默认 [undefined, undefined] */
  modelValue?: NumberRangeTuple
  /** 与 modelValue[0] 同步，可用 v-model:start */
  start?: number
  /** 与 modelValue[1] 同步，可用 v-model:end */
  end?: number
  /** 左侧占位。默认 '请输入' */
  startPlaceholder?: string
  /** 右侧占位。默认 '请输入' */
  endPlaceholder?: string
  /** 中间分隔文案。默认 '~' */
  separator?: string
}

/** 数字范围输入组件事件 */
export interface NumberRangeInputEmits {
  (event: 'update:modelValue', value: NumberRangeTuple): void
  (event: 'update:start', value: number | undefined): void
  (event: 'update:end', value: number | undefined): void
  (event: 'change', value: NumberRangeTuple): void
}

/** 暴露成员；为空，模板 ref 上无可访问成员 */
export interface NumberRangeInputExposed {}
```

继承自 `NumberInputProps` 且本组件支持并透传到两端的属性：`currency`、`precision`、`minPrecision`、`maxPrecision`、`step`、`min`、`max`、`multiple`、`prefix`、`suffix`、`clearable`；表单属性 `size`、`label`、`field`、`rules`、`tips`、`span`、`disabled`、`readonly` 的取值与约束见 `agent-docs/desktop/number-input.md` 的「API 签名」与「参数说明」。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `[number \| undefined, number \| undefined]` | `[undefined, undefined]` | 否 | 二元元组，顺序为 [起始, 结束]；`v-model` 绑定 |
| `start` | `number \| undefined` | — | 否 | 与 `modelValue[0]` 同步；`v-model:start` 绑定 |
| `end` | `number \| undefined` | — | 否 | 与 `modelValue[1]` 同步；`v-model:end` 绑定 |
| `startPlaceholder` | `string` | `'请输入'` | 否 | 左侧输入框占位 |
| `endPlaceholder` | `string` | `'请输入'` | 否 | 右侧输入框占位 |
| `separator` | `string` | `'~'` | 否 | 中间分隔文案；仅影响显示，不参与 model |
| `min` / `max` / `step` / `currency` / `precision` / `minPrecision` / `maxPrecision` / `multiple` | 同 `UNumberInput` | 同 `UNumberInput` | 否 | 透传到左右两个数字输入框，**各自独立生效**（如 `max` 分别钳制两端） |
| `disabled` / `readonly` / `size` | `boolean` / `boolean` / `ComponentSize` | `false` / `false` / `'default'` | 否 | 同时作用于两端；未传时继承 `UForm` 对应属性 |
| `field` | `string` | — | 否 | 仅 `UForm` 内生效；字段值为元组 |
| `label` / `rules` / `tips` / `span` | 同 FormComponentProps | — | 否 | 仅 `UForm` / `UFormItem` 内生效 |

继承属性的完整约束（即时钳制、精度规则、倍数换算）见 `agent-docs/desktop/number-input.md`。注意本组件**没有** `placeholder` 属性，分别用 `startPlaceholder` / `endPlaceholder`。

## 方法与事件

事件：

- `update:modelValue(value: NumberRangeTuple)` — 任一侧输入或清除时触发，参数为完整元组；**输入过程中不做起止交叉约束**（例如 start 为 50 时把 end 改成 2，元组暂为 `[50, 2]`）。
- `update:start(value)` / `update:end(value)` — 与元组同步写出，用于 `v-model:start` / `v-model:end`。
- `change(value: NumberRangeTuple)` — **任一侧失焦时**触发一次，参数为校正后的元组。

两端联动规则（源码行为）：

- 元组模式（`v-model`）：失焦时只校正本次编辑的一侧——改 start 且 `start > end` 时压回 `[end, end]`；改 end 且 `end < start` 时抬到 `[start, start]`。
- 分侧模式（`v-model:start` / `v-model:end`）：外部写入的 `start` / `end` 若 `start > end`，统一归一为 `[start, start]`（end 抬到 start）。
- 仅绑定 `start` / `end` 且 `modelValue` 为空时，挂载后用 `start` / `end` 初始化元组；两种绑定方式并存时自动保持同步。

暴露：`NumberRangeInputExposed` 为空接口，模板 ref 上无可访问成员。

## 典型示例

### v-model:start / v-model:end 分侧绑定

```vue
<script setup lang="ts">
import { UNumberRangeInput } from '@veltra/desktop'
import { shallowRef } from 'vue'

const start = shallowRef<number | undefined>(5)
const end = shallowRef<number | undefined>(20)
</script>

<template>
  <!-- start / end 各自绑定一个变量；start 大于 end 时失焦会校正为同值 -->
  <u-number-range-input
    v-model:start="start"
    v-model:end="end"
    start-placeholder="最低价"
    end-placeholder="最高价"
    separator="至"
    style="width: 300px"
  />
</template>
```

### 货币区间 + 倍数 + 步长

```vue
<script setup lang="ts">
import type { NumberRangeTuple } from '@veltra/desktop'
import { UNumberRangeInput } from '@veltra/desktop'
import { shallowRef } from 'vue'

// 以「分」为单位存储：显示 ¥100.00 ~ ¥500.00
const priceRange = shallowRef<NumberRangeTuple>([10000, 50000])
</script>

<template>
  <!-- currency / multiple / step / precision 同时作用于两端；step=100 表示原始值（元）+100 -->
  <u-number-range-input
    v-model="priceRange"
    currency
    :multiple="100"
    :precision="2"
    :step="100"
    :min="0"
    style="width: 320px"
  />
</template>
```

### 在 UForm 中用 field 绑定与 validator 校验

```vue
<script setup lang="ts">
import type { FormExposed } from '@veltra/desktop'
import { UButton, UForm, UNumberRangeInput } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

const formRef = shallowRef<FormExposed>()
const formData = reactive({ scoreRange: [0, 100] as [number | undefined, number | undefined] })

// 元组校验：required 校验空数组；自定义规则校验区间语义
function validateRange(value: any) {
  if (!value || !value.length) return ''
  const [min, max] = value
  if (min != null && max != null && min > max) return '最低分不能高于最高分'
  return ''
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (valid) console.log('提交', formData.scoreRange)
}
</script>

<template>
  <u-form ref="formRef" :model="formData" label-width="80px" :cols="1">
    <u-number-range-input
      label="分数区间"
      field="scoreRange"
      :min="0"
      :max="100"
      :rules="{ validator: validateRange }"
      start-placeholder="最低分"
      end-placeholder="最高分"
      style="width: 320px"
    />
  </u-form>
  <u-button type="primary" @click="handleSubmit">提交</u-button>
</template>
```

## 注意事项

> [!WARNING]
> - `UForm` 内用 `field` 绑定 model，**禁止**再写 `v-model`；独立于 `UForm` 使用时才走 `v-model`（元组）或 `v-model:start` / `v-model:end`。
> - 本库 `modelValue` 是**二元元组** `[起始, 结束]`，不是 `min` / `max` 两个独立字段组成的对象。
> - 本库没有 `placeholder` 属性（从 `UNumberInput` 继承中被 Omit），占位符用 `startPlaceholder` / `endPlaceholder`。
> - 起止越界不是校验报错，而是**失焦时自动压值**（把后编辑的一侧压到与另一侧相同）；需要「报错提示」时用 `rules.validator`。
> - `min` / `max` / `step` / `currency` / `precision` 等对两端各自独立生效，不是对整个区间约束。
> - `separator` 只是展示文案，不写入 model；只读态显示为 `起始 ~ 结束`（缺侧显示 `—`，全空显示 `-`）。
> - 未在透传白名单中的属性（如 `placeholder`、`nativeReadonly`、`pattern`）不会传给内部输入框；普通 attrs 落在外层容器 `div` 上（可用来设宽度，如 `style="width: 300px"`）。

## 常见问题

### 想让「start 大于 end」时报错，而不是被自动改值

自动压值是组件内置行为，无法关闭。需要报错提示时去掉对顺序的依赖，用 `rules.validator` 自行校验（见「典型示例」第三例），错误文案会显示在表单项下方。
