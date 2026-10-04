---
title: URate 评分
description: '@veltra/desktop 导出的评分组件，用于星级打分。v-model 绑定分值，支持 count 总数、allowHalf 半星、readonly / disabled、character 自定义字符与 color 自定义颜色，悬浮预览并支持方向键微调。'
aliases: [URate, Rate, 评分, 星级评分, 打分, ElRate]
keywords:
  [
    RateProps,
    RateEmits,
    modelValue,
    count,
    allowHalf,
    character,
    color,
    readonly,
    disabled,
    评分,
    星级,
    打分,
    半星,
    自定义字符,
    change事件
  ]
---

# URate 评分

`@veltra/desktop` 导出评分组件 `URate`，渲染一排可点击的星形图标，用于星级打分。`v-model` 绑定 `0 ~ count` 的分值，支持 `allowHalf` 半星、`character` 自定义字符、`color` 自定义选中色、`readonly` / `disabled` 只读禁用；悬浮时预览分值，聚焦后可用方向键按步长调整。

## 快速上手

```vue
<script setup lang="ts">
import { URate } from '@veltra/desktop'
import { shallowRef } from 'vue'

const value = shallowRef(3)
</script>

<template>
  <u-rate v-model="value" />
  <span>当前分值：{{ value }}</span>
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、星星无颜色。

## API 签名

```ts
/** 评分组件属性 */
export interface RateProps extends FormComponentProps {
  /** 当前分值，v-model 双向绑定，0 到 count 之间 */
  modelValue?: number
  /** 星星总数 */
  count?: number
  /** 是否允许半星 */
  allowHalf?: boolean
  /** 自定义字符，不传时渲染星形图标 */
  character?: string
  /** 自定义选中颜色，默认取主题 warning 色 */
  color?: string
}

export interface RateEmits {
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
}

export interface RateExposed {}
```

## 参数说明

| 参数         | 类型      | 默认            | 必填 | 约束                                                          |
| ------------ | --------- | --------------- | :--: | ------------------------------------------------------------- |
| `modelValue` | `number`  | `0`             |  否  | 取值 `0 ~ count`；`allowHalf` 为 `true` 时可含 0.5 步长       |
| `count`      | `number`  | `5`             |  否  | 星星总数，正整数                                              |
| `allowHalf`  | `boolean` | `false`         |  否  | 为 `true` 时点击 / 悬浮星星左半颗计半星                       |
| `character`  | `string`  | 星形图标        |  否  | 传入任意字符替代星形图标，灰彩两层同字符裁剪                  |
| `color`      | `string`  | 主题 warning 色 |  否  | 选中层颜色，任意 CSS 颜色值；未传走主题 token                 |
| `disabled`   | `boolean` | `false`         |  否  | 回退链：自身 `disabled` > 所在 UForm 的 `disabled` > 全局配置 |
| `readonly`   | `boolean` | `false`         |  否  | 只读展示，不响应点击 / 悬浮 / 键盘；回退链同 `disabled`       |

继承自 `FormComponentProps` 的 `label` / `field` / `span` / `tips` / `rules` 供 `UForm` 表单拦截使用。暴露：`RateExposed` 为空对象，无可用方法或属性。

## 方法与事件

| 事件                | payload  | 触发时机                                                      |
| ------------------- | -------- | ------------------------------------------------------------- |
| `update:modelValue` | `number` | 点击星星或方向键调整后分值变化时                              |
| `change`            | `number` | 与 `update:modelValue` 同时发出；点击当前同分值不发（值未变） |

键盘交互：组件聚焦（`Tab` 进入）后 `ArrowRight` / `ArrowUp` 加一步、`ArrowLeft` / `ArrowDown` 减一步，步长为 `allowHalf ? 0.5 : 1`，越界自动截断在 `0 ~ count`。`disabled` 或 `readonly` 时不响应键盘且不进入 Tab 序列。

## 典型示例

### 半星评分

```vue
<script setup lang="ts">
import { URate } from '@veltra/desktop'
import { shallowRef } from 'vue'

const value = shallowRef(2.5)
</script>

<template>
  <u-rate v-model="value" allow-half />
  <span>当前分值：{{ value }}</span>
</template>
```

### 只读与禁用

```vue
<script setup lang="ts">
import { URate } from '@veltra/desktop'
</script>

<template>
  <!-- 只读展示：不响应交互 -->
  <u-rate :model-value="4" readonly />

  <!-- 禁用：置灰且不可交互，跟随所在 UForm 的 disabled -->
  <u-rate :model-value="2" disabled />
</template>
```

### 自定义字符与颜色

```vue
<script setup lang="ts">
import { URate } from '@veltra/desktop'
import { shallowRef } from 'vue'

const charValue = shallowRef(4)
const colorValue = shallowRef(5)
</script>

<template>
  <!-- character 用任意字符替代星星 -->
  <u-rate v-model="charValue" character="好" />

  <!-- color 指定选中色，count 调整总数 -->
  <u-rate v-model="colorValue" color="#e63946" :count="6" />
</template>
```

## 注意事项

> [!WARNING]
>
> - 分值总数属性是 `count`，不是 Element Plus 的 `max`；半星开关是 `allowHalf`，同 AntD。
> - 点击与当前分值相同的星星不会清零；AntD 的 `allowClear` 行为本库未实现，需要清零请自行在业务层处理。
> - `character` 只接受字符串；不支持 AntD 的 `character` 插槽 / VNode 与 `tooltips` 悬浮文案。
> - `color` 未传时选中色取主题 `warning` token 并随主题切换；传入硬编码色值后不再跟随主题。
