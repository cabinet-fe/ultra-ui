---
title: "USlider 滑块"
description: "滑块控件，通过拖动或点击滑轨选取数值，range 时选取数值区间 [number, number]；支持步长刻度、垂直模式，可在 UForm 内用 field 绑定表单字段。"
aliases: [slider, Slider, 滑块, 拖动条, 范围滑块, 滑动条]
keywords:
  - modelValue
  - min
  - max
  - step
  - range
  - vertical
  - update:modelValue
  - field
  - rules
  - 滑块
  - 拖动
  - 范围选择
  - 步长
  - 刻度
  - 垂直滑块
  - 表单数值
---

# USlider 滑块

`@veltra/desktop` 导出 `USlider`。拖动滑块或点击滑轨选取数值；`range` 为 `true` 时渲染双滑块、绑定值是区间 `[number, number]`。需要精确输入数值时用 `UNumberInput`，需要连续/区间取值时用 `USlider`。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { USlider } from '@veltra/desktop'

const volume = ref(20)
</script>

<template>
  <!-- 默认区间 0~100 -->
  <u-slider v-model="volume" />
  <!-- => 拖动到中点后 volume 为 50 -->
</template>
```

## API 签名

```ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 滑块组件属性；泛型 T 由 modelValue 推导：单值 number，范围 [number, number] */
export interface SliderProps<T extends number | [number, number]> extends FormComponentProps {
  /** 绑定值。range 为 true 时必须是二元组 [number, number]，产出值始终升序 */
  modelValue?: T
  /** 最小值。默认 0 */
  min?: number
  /** 最大值。默认 100 */
  max?: number
  /** 步长；设置后滑块按步长吸附，滑轨上显示步长刻度 */
  step?: number
  /** 是否是范围滑块。默认 false；true 时渲染两个滑块 */
  range?: boolean
  /** 是否垂直模式。默认 false；true 时必须给组件设置高度 */
  vertical?: boolean
}

/** 滑块组件定义的事件 */
export interface SliderEmits<T extends number | [number, number]> {
  (e: 'update:modelValue', value: T): void
}

/** 滑块组件暴露的属性和方法(组件内部使用) */
export interface _SliderExposed {}

/** 滑块组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SliderExposed = DeconstructValue<_SliderExposed>
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `number \| [number, number]` | — | 否 | `range` 为 `true` 时必须是二元组，且产出值升序排列；未设置时滑块停在 `min` 端 |
| `min` | `number` | `0` | 否 | 区间下界 |
| `max` | `number` | `100` | 否 | 区间上界 |
| `step` | `number` | — | 否 | 设置后取值按步长吸附并显示刻度；不设置则连续（产出值仍为整数） |
| `range` | `boolean` | `false` | 否 | `true` 时双滑块；此模式下点击滑轨无效，仅能拖动滑块 |
| `vertical` | `boolean` | `false` | 否 | `true` 时垂直渲染，必须给组件设置高度（如 `style="height: 300px"`），否则无法取值 |
| **继承自 `FormComponentProps`** | | | | |
| `size` | `ComponentSize` | `'default'` | 否 | `'small'` \| `'default'` \| `'large'`；未设置时继承 `<u-form>` 的 `size` |
| `label` | `string` | — | 否 | 表单标签文字；仅在 `UForm` / `UFormItem` 内生效 |
| `field` | `string` | — | 否 | `UForm` 字段名；在 `UForm` 内必须用 `field` 绑定，禁止再写 `v-model` |
| `tips` | `string` | — | 否 | 表单内提示文字；仅在 `UForm` / `UFormItem` 内生效 |
| `span` | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | — | 否 | 表单中所占列数；`'full'` 占满一行，响应式对象的 `default` 必填 |
| `disabled` | `boolean` | `false` | 否 | 禁用：滑块不可拖动、滑轨不可点击；未设置时继承 `<u-form>` 的 `disabled` |
| `readonly` | `boolean` | `false` | 否 | 只读：整个滑块渲染为 `modelValue` 的文本 |
| `rules` | `ValidateRule` | — | 否 | 校验规则；仅在 `UForm` 内生效 |

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `value: T` | 拖动滑块或点击滑轨导致取值变化后（拖动过程中持续触发）；单值模式 payload 为 `number`，范围模式为升序 `[number, number]`，值与当前相同时不触发 |

组件只有 `update:modelValue`，没有 `change` 事件。组件未 `defineExpose` 任何方法。

## 典型示例

### 边界、步长与取值监听

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { USlider } from '@veltra/desktop'

const value = ref(50)

function handleUpdate(v: number) {
  console.log(v) // => 10 的整数倍（step 吸附）
}
</script>

<template>
  <!-- 设置 step 后按 10 吸附，滑轨显示刻度；点击滑轨也可直接跳到该位置 -->
  <u-slider v-model="value" :min="0" :max="100" :step="10" @update:model-value="handleUpdate" />
</template>
```

### 范围选择与垂直模式

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { USlider } from '@veltra/desktop'

const span = ref<[number, number]>([20, 80])
const height = ref(150)
</script>

<template>
  <!-- 范围模式：两个滑块，点击滑轨无效，值始终升序 -->
  <u-slider v-model="span" range />
  <!-- => 拖动后 span 形如 [30, 70]；拖到交叉点也会排序为 [小, 大] -->

  <!-- 垂直模式：必须给高度，否则无法取值 -->
  <u-slider v-model="height" vertical style="height: 300px" />
</template>
```

### 在 UForm 内用 field 绑定

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UForm, USlider } from '@veltra/desktop'

const formData = reactive({ opacity: 80 })
</script>

<template>
  <!-- 有 field 就不要再写 v-model；值写入 formData.opacity -->
  <u-form :model="formData">
    <u-slider label="不透明度" field="opacity" :min="0" :max="100" :rules="{ required: true }" />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
> - `range` 为 `true` 时 `modelValue` 必须是 `[number, number]` 二元组；把单个 `number` 绑给范围滑块取值不正确。反向同理：单值模式禁止绑定数组。
> - 范围模式的产出值始终按升序排列；两个滑块拖到交叉点时组件会自动排序。
> - 范围模式下点击滑轨无效，仅能拖动滑块；单值模式点击滑轨直接跳到点击位置（按 `step` 吸附）。
> - 本库没有 `change` 事件，监听取值变化用 `@update:model-value`。
> - `vertical` 为 `true` 时必须给组件设置高度；未设置高度时组件无法产出值。
> - 拖动与点击产出的值为整数（内部按 `Math.round` 取整）；`step` 为小数时按步长吸附后仍会取整。
> - `readonly` 时整个滑块渲染为 `modelValue` 文本；在 `UForm` 内必须用 `field` 绑定字段，有 `field` 时禁止再写 `v-model`。
> - 组件颜色来自 `--u-*` token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则组件无颜色。

## 常见问题

### 垂直滑块拖不动或取不到值

原因：`vertical` 为 `true` 但组件高度为 0 或未设置。修复：给组件明确高度：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { USlider } from '@veltra/desktop'

const value = ref(50)
</script>

<template>
  <u-slider v-model="value" vertical style="height: 300px" />
</template>
```

### 拖动后 `modelValue` 变成整数，丢失小数

原因：取值内部按 `Math.round` 取整。修复：放大量纲（如用 0~100 表示 0~1），在业务侧换算：

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { USlider } from '@veltra/desktop'

const percent = ref(50)
// 换算回 0~1 的小数
const ratio = computed(() => percent.value / 100)
</script>

<template>
  <u-slider v-model="percent" :min="0" :max="100" :step="1" />
  <!-- => percent 为 50 时 ratio 为 0.5 -->
</template>
```
