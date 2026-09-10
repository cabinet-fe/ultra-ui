---
title: UFormItem 表单项
description: "表单项容器：为字段提供 label、必填标记、提示（tips）、栅格占位（span）与校验错误展示。单字段控件写 field 即可由 UForm 自动生成，无需手写；仅当控件值需转换（如开关）、多控件组合成一个字段、或自定义 label 与单项布局时才显式使用。"
aliases: ["UFormItem", "FormItem", "el-form-item", "表单项", "字段容器"]
keywords:
  - field
  - rules
  - tips
  - span
  - labelWidth
  - labelPosition
  - modelValue
  - update:modelValue
  - change
  - required
  - validator
  - preset
  - ValidateRule
  - 值转换
  - 多控件组合
  - 自定义控件
  - 开关字段
  - 自定义标签
  - 校验规则
  - 必填标记
  - 栅格占位
  - 错误提示
---

# UFormItem 表单项

`@veltra/desktop` 导出表单项容器 `UFormItem`。它为字段渲染 label、必填星标、悬浮提示（`tips`）与校验错误文本，并把内部控件的 `change` 冒泡到表单。

单字段控件只要写 `field`，`UForm` 会自动为它生成一个 `UFormItem`，并把控件上的 `label` / `rules` / `tips` / `span` / `readonly` 透传给该表单项——所以**单字段场景不需要手写 `UFormItem`**。仅在以下两种场景显式使用：控件值需转换或多控件组合成一个字段。此时把 `field` 写在 `UFormItem` 上，内部控件自行处理 `v-model`（或 `:model-value` / `@update:model-value`），**内部控件不要再写 `field`**（否则会被 `UForm` 再包一层表单项，形成双重绑定）。

## 快速上手

`field` / `label` / `rules` 写在 `UFormItem` 上，内部控件自行 `v-model` 绑定 model 路径，**控件上不要再写 `field`**。`UFormItem` 必须在 `UForm` 内使用，否则 `rules` 不参与校验。

```vue
<script setup lang="ts">
import { UFormItem, UNumberInput, UInput } from '@veltra/desktop'
import { reactive } from 'vue'

const formData = reactive({
  name: '',
  priceRange: { min: undefined as number | undefined, max: undefined as number | undefined }
})
</script>

<template>
  <u-form :model="formData" label-width="100px" :cols="1">
    <u-input label="商品名" field="name" :rules="{ required: '商品名不能为空' }" />

    <!-- 两个输入组合成 priceRange 一个字段，校验与提示写在 Item 上 -->
    <u-form-item
      label="价格区间"
      field="priceRange"
      :rules="{ required: '请填写价格区间' }"
      tips="最低价不能高于最高价"
    >
      <u-number-input v-model="formData.priceRange.min" placeholder="最低" />
      <span>—</span>
      <u-number-input v-model="formData.priceRange.max" placeholder="最高" />
    </u-form-item>
  </u-form>
</template>
```

## API 签名

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

/** 字段校验规则 */
export interface ValidateRule {
  /** 是否必填。`true` 用默认文案「该项不能为空」，字符串为自定义文案 */
  required?: boolean | string
  /** 精确长度；`[长度, 错误文案]` 自定义文案 */
  length?: number | [number, string]
  /** 最小值（数字）；`[最小值, 错误文案]` 自定义文案 */
  min?: number | [number, string]
  /** 最大值（数字）；`[最大值, 错误文案]` 自定义文案 */
  max?: number | [number, string]
  /** 最小长度（字符串/数组）；`[最小长度, 错误文案]` 自定义文案 */
  minLen?: number | [number, string]
  /** 最大长度（字符串/数组）；`[最大长度, 错误文案]` 自定义文案 */
  maxLen?: number | [number, string]
  /** 正则匹配；RegExp、字符串正则或 `[规则, 错误文案]` */
  match?: RegExp | [RegExp, string] | string
  /** 预设规则：'email' | 'phone' | 'num' | 'url' | 'idCard' */
  preset?: PresetRule
  /** 自定义校验；返回错误文案表示不通过，返回空串或 resolve 空表示通过。最后执行 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

/** 表单项属性（继承 FormComponentProps，此处已展开） */
export interface FormItemProps {
  /** 组件尺寸。默认 'default'，未传时回退 UForm 的 size */
  size?: ComponentSize
  /** 校验规则；必须同时有 field 与所在表单的 model 才生效 */
  rules?: ValidateRule
  /** 表单项字段路径（支持 `a.b` 嵌套）；必填标记、校验、change 冒泡都依赖它 */
  field?: string
  /** 表单标签文字；与 #label 插槽二选一，插槽优先 */
  label?: string
  /** 悬浮提示文案，hover 500ms 后显示 */
  tips?: string
  /** 栅格占位；未传为 1 列 */
  span?: number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 是否禁用；未传时回退 UForm 的 disabled */
  disabled?: boolean
  /** 是否只读；未传时回退 UForm 的 readonly */
  readonly?: boolean
  /** 标签宽度；未传时回退 UForm 的 labelWidth，再回退全局配置（默认 100px） */
  labelWidth?: string | number
  /** 标签位置；未传时回退 UForm 的 labelPosition。默认 'left' */
  labelPosition?: 'top' | 'left'
}

/** 表单项事件 */
export interface FormItemEmits {
  /** 内部控件 change 冒泡，args 与控件 change 参数一致 */
  (e: 'change', ...args: any[]): void
}

/** 表单项无公开方法，模板 ref 上无可调用成员 */
export interface FormItemExposed {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `field` | `string` | — | 是（需 label/校验时） | 支持 `a.b` 嵌套路径；缺失时 label、必填星标、校验全部不生效 |
| `label` | `string` | — | 否 | 与 `#label` 插槽二选一；`labelPosition='left'` 时自动追加冒号 |
| `rules` | `ValidateRule` | — | 否 | 执行顺序：`required` 先行，其余规则按对象键序，`validator` 最后；需所在 `UForm` 的 `model` |
| `tips` | `string` | — | 否 | 悬浮提示文案；包裹 label，hover 500ms 后显示 |
| `span` | `number \| 'full' \| BreakpointMap` | `1` | 否 | `number` 占 N 列；`'full'` 占满整行；对象按断点取值回落 `default`；`0` 时不渲染 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 回退链：自身 → UForm `size` → `'default'` |
| `disabled` | `boolean` | UForm `disabled` | 否 | 回退链：自身 → UForm |
| `readonly` | `boolean` | UForm `readonly` | 否 | 只读时错误提示区隐藏 |
| `labelWidth` | `string \| number` | `100`（全局配置） | 否 | number 单位 px；回退链：自身 → UForm `labelWidth` → 全局配置 |
| `labelPosition` | `'top' \| 'left'` | `'left'` | 否 | 回退链：自身 → UForm `labelPosition`；`'top'` 时忽略 `labelWidth` 且不追加冒号 |

`required: true` 的默认文案为「该项不能为空」；`preset` 各档默认文案：`email`「邮箱格式不正确」、`phone`「手机号格式不正确」、`num`「数字格式不正确」、`url`「链接格式不正确」、`idCard`「身份证格式不正确」。空值（`null`、`undefined`、`''`、空数组）跳过 `min` / `max` / `minLen` / `maxLen` / `match` / `preset` 校验。

## 方法与事件

- `change(...args)` — 默认插槽内任意控件触发 `change` 时冒泡，`args` 与该控件的 `change` 参数完全一致。编程写入 `model` 不触发 `change`，只触发 `UForm` 的 `field:update`。
- 校验行为 — Item 带 `field` 时注册进表单：`model[field]` 每次变化自动重新校验（`reset()` 期间抑制）；异步 `validator` 采用递增序号，仅采纳最新一次结果。错误文本渲染在内容区下方，`readonly` 或表单 `noTips` 时不显示。
- 暴露 — 无公开方法；`FormItemExposed` 为空类型，模板 ref 上无可调用成员。

## 典型示例

### 多控件组合同一字段

```vue
<script setup lang="ts">
import { UFormItem, UInput } from '@veltra/desktop'
import { reactive } from 'vue'

const formData = reactive({ dateRange: { startDate: '', endDate: '' } })
</script>

<template>
  <u-form :model="formData" :cols="1">
    <u-form-item
      label="日期范围"
      field="dateRange"
      :rules="{
        validator: (val) => (!val.startDate || !val.endDate ? '请选择完整的起止日期' : '')
      }"
    >
      <u-input v-model="formData.dateRange.startDate" placeholder="开始日期" />
      <span> 至 </span>
      <u-input v-model="formData.dateRange.endDate" placeholder="结束日期" />
    </u-form-item>
  </u-form>
</template>
```

### 自定义 label 插槽与单项布局覆盖

```vue
<script setup lang="ts">
import { UCheckbox, UFormItem, UTextarea } from '@veltra/desktop'
import { reactive } from 'vue'

const formData = reactive({ agree: false, note: '' })
</script>

<template>
  <u-form :model="formData" label-position="top" :cols="1">
    <u-form-item field="agree">
      <template #label>
        <span>我已阅读并同意条款</span>
      </template>
      <u-checkbox v-model="formData.agree" />
    </u-form-item>

    <!-- 表单整体 label-position="top"，单项覆盖回 left 并自定义宽度 -->
    <u-form-item label="备注" field="note" label-position="left" label-width="80px" :span="'full'">
      <u-textarea v-model="formData.note" :rows="3" />
    </u-form-item>
  </u-form>
</template>
```

### 包裹控件并转换字段值（开关）

把 `field` 写在 `UFormItem` 上即可获得 label 与校验；内部控件用 `:model-value` / `@update:model-value` 自行完成读时归一与写时转换。`USwitch` 只接受布尔值，当字段允许 `undefined`（未设置）且约定 `undefined` 与 `true` 都显示为「开」时，必须这样转换。

```vue
<script setup lang="ts">
import { UFormItem, USwitch } from '@veltra/desktop'
import { reactive } from 'vue'

// status 允许 undefined（未设置，视为开）
const formData = reactive({ status: undefined as boolean | undefined })
</script>

<template>
  <u-form :model="formData" :cols="1">
    <u-form-item label="启用状态" field="status">
      <!-- undefined 与 true 都为「开」；写入时统一落成布尔值 -->
      <u-switch
        :model-value="formData.status === undefined || formData.status === true"
        @update:model-value="(val) => (formData.status = val)"
        active-text="开"
        inactive-text="关"
      />
    </u-form-item>
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
> - 本库的组合字段写法是 `field` 写在 `UFormItem`、内部控件用 `v-model`（值需转换时用 `:model-value` / `@update:model-value`），**不是**控件上再写一遍 `field`；控件带 `field` 会被 `UForm` 拦截成独立表单项，导致双重绑定。
> - 单字段控件只需在控件上写 `field`：`UForm` 自动生成 `UFormItem`，并把控件的 `label` / `rules` / `tips` / `span` / `readonly` 透传给该表单项（即控件上的这些属性最终挂在自动生成的 `UFormItem` 上）。仅在控件值需转换、多控件组合一个字段、自定义 label、单项覆盖布局这几种场景才手写 `UFormItem`。
> - `UFormItem` 必须位于 `UForm` 内：校验依赖表单注入的 `model` 与 `validateFields`，脱离表单时 `rules` 静默不校验。
> - 与 Element Plus / Ant Design 不同，本库不需要为每个字段手写表单项容器；给单个控件套 `UFormItem` 且内部控件再写 `field` 是错误的双包写法。
> - 内部控件 `change` 冒泡为 Item 的 `change`；编程写入 `model` 只触发 `UForm` 的 `field:update`，监听不到 `change`。
> - `span: 0` 会让整个表单项不渲染，仅用于动态隐藏字段。

## 常见问题

### label 与校验都不出现

原因：`UFormItem` 漏写 `field`。修复：补上与 `model` 对应的字段路径，如 `field="priceRange"`；不需要 label 时也必须写 `field` 才能挂上校验。

### 换了 `field` 值后旧字段仍在校验

原因：`field` 动态变更会先注销旧字段再注册新字段，若新旧 Item 同时存在且指向同一 `field` 会相互覆盖注册。修复：保证同一 `field` 同一时刻只有一个 `UFormItem`（或带 `field` 的控件）在渲染，用 `v-if` 切换时配合 `key`。
