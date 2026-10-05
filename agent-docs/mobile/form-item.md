---
title: UFormItem 表单项（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端表单项容器：为字段提供 label、必填标记、校验错误展示与 change 冒泡，默认列表行式（label 左、控件占右侧剩余宽度、行高约 48px、相邻行细分隔线、整行热区 ≥44px），校验反馈为行内下方文本。单字段控件写 field 即可由 UForm 自动生成，无需手写；仅当控件值需转换（如开关）、多控件组合成一个字段、或自定义 label 时才显式使用。'
aliases: ['UFormItem', 'FormItem', 'el-form-item', '表单项', '字段容器']
keywords:
  - field
  - rules
  - label
  - labelWidth
  - labelPosition
  - required
  - validator
  - preset
  - ValidateRule
  - change
  - 行式
  - 值转换
  - 多控件组合
  - 自定义标签
  - 校验规则
  - 必填标记
  - 错误提示
  - 移动端表单项
---

# UFormItem 表单项（@veltra/mobile 移动端）

`@veltra/mobile` 导出表单项容器 `UFormItem`。它为字段渲染 label、必填星标与校验错误文本，并把内部控件的 `change` 冒泡到表单。移动端默认**列表行式**：label 在左、控件区占右侧剩余宽度、行高约 48px、相邻行细分隔线、整行热区 ≥44px；`labelPosition` 默认 `'left'`，`'top'` 时 label 纵向堆叠在控件上方（适合文本域等长控件）。

单字段控件只要写 `field`，`UForm` 会自动为它生成一个 `UFormItem`，并把控件上的 `label` / `rules` / `span` / `tips` / `readonly` / `field` 透传给该表单项——所以**单字段场景不需要手写 `UFormItem`**。仅在以下两种场景显式使用：控件值需转换或多控件组合成一个字段。此时把 `field` 写在 `UFormItem` 上，内部控件自行处理 `v-model`（或 `:model-value` / `@update:model-value`），**内部控件不要再写 `field`**（否则会被 `UForm` 再包一层表单项，形成双重绑定）。

## 快速上手

`field` / `label` / `rules` 写在 `UFormItem` 上，内部控件自行 `v-model` 绑定 model 路径，**控件上不要再写 `field`**。`UFormItem` 必须在 `UForm` 内使用，否则 `rules` 不参与校验。

```vue
<script setup lang="ts">
import { UForm, UFormItem, UInput, UNumberInput } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/form-item/style'
import '@veltra/mobile/components/input/style'
import '@veltra/mobile/components/number-input/style'

const formData = reactive({
  name: '',
  priceRange: { min: undefined as number | undefined, max: undefined as number | undefined }
})
</script>

<template>
  <UForm :model="formData">
    <UInput label="商品名" field="name" :rules="{ required: '商品名不能为空' }" />

    <!-- 两个输入组合成 priceRange 一个字段，校验与标签写在 Item 上 -->
    <UFormItem
      label="价格区间"
      field="priceRange"
      :rules="{ required: '请填写价格区间' }"
    >
      <UNumberInput v-model="formData.priceRange.min" placeholder="最低" />
      <span>—</span>
      <UNumberInput v-model="formData.priceRange.max" placeholder="最高" />
    </UFormItem>
  </UForm>
</template>
```

视觉初始化前提：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。组件按需样式引入路径为 `@veltra/mobile/components/form-item/style`。

## API 签名

```ts
// 以下公共类型定义来自 @veltra/utils（@veltra/mobile 未再导出，此处仅说明 prop 类型）
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

/** 表单项属性（FormItemProps 继承的 FormComponentProps 已展开） */
export interface FormItemProps {
  /** 组件尺寸。默认 'default'，未传时回退 UForm 的 size */
  size?: ComponentSize
  /** 校验规则；必须同时有 field 与所在表单的 model 才生效 */
  rules?: ValidateRule
  /** 表单项字段路径（支持 `a.b` 嵌套）；校验注册与 model 联动依赖它 */
  field?: string
  /** 表单标签文字；与 #label 插槽二选一，插槽优先 */
  label?: string
  /** 提示文案；移动端不渲染悬浮提示，声明保留 */
  tips?: string
  /** 栅格占位；移动端 UForm 单列呈现，该属性不生效 */
  span?:
    number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 是否禁用；未传时回退 UForm 的 disabled */
  disabled?: boolean
  /** 是否只读；未传时回退 UForm 的 readonly */
  readonly?: boolean
  /**
   * 标签宽度；number 单位 px
   * - 回退链：自身 → UForm 的 labelWidth
   * - 都未传时 label 按内容自适应宽度（移动端默认）
   */
  labelWidth?: string | number
  /** 标签位置；未传时回退 UForm 的 labelPosition。移动端默认 'left' 行式 */
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

| 参数            | 类型                                | 默认              |         必填          | 约束                                                                                       |
| --------------- | ----------------------------------- | ----------------- | :-------------------: | ------------------------------------------------------------------------------------------ |
| `field`         | `string`                            | —                 | 是（需校验时）        | 支持 `a.b` 嵌套路径；缺失时字段不注册进表单，校验与 model 联动不生效；label 与必填星标不受影响（分别取决于 `label`/`#label` 插槽与 `rules.required`） |
| `label`         | `string`                            | —                 |          否           | 与 `#label` 插槽二选一；必填星标渲染在 label 文字左侧                                       |
| `rules`         | `ValidateRule`                      | —                 |          否           | 执行顺序：`required` 先行，其余规则按对象键序，`validator` 最后；需所在 `UForm` 的 `model`  |
| `tips`          | `string`                            | —                 |          否           | 声明保留；移动端不渲染悬浮提示                                                             |
| `span`          | `number \| 'full' \| BreakpointMap` | —                 |          否           | 声明保留；移动端 UForm 单列呈现，不生效                                                    |
| `size`          | `'small' \| 'default' \| 'large'`   | `'default'`       |          否           | 回退链：自身 → UForm `size` → `'default'`                                                  |
| `disabled`      | `boolean`                           | UForm `disabled`  |          否           | 回退链：自身 → UForm                                                                       |
| `readonly`      | `boolean`                           | UForm `readonly`  |          否           | 只读时错误提示区隐藏                                                                       |
| `labelWidth`    | `string \| number`                  | 内容自适应        |          否           | number 单位 px；传了固定宽对齐，未传时按内容自适应；回退链：自身 → UForm `labelWidth`；仅 `labelPosition='left'` 时生效 |
| `labelPosition` | `'top' \| 'left'`                   | `'left'`          |          否           | 默认 `'left'` 行式（label 左、控件右）；`'top'` 时 label 在控件上方；回退链：自身 → UForm `labelPosition` |

`required: true` 的默认文案为「该项不能为空」；`preset` 各档默认文案：`email`「邮箱格式不正确」、`phone`「手机号格式不正确」、`num`「数字格式不正确」、`url`「链接格式不正确」、`idCard`「身份证格式不正确」。空值（`null`、`undefined`、`''`、空数组）跳过 `min` / `max` / `minLen` / `maxLen` / `match` / `preset` 校验。

## 方法与事件

- `change(...args)` — 默认插槽内任意控件触发 `change` 时冒泡，`args` 与该控件的 `change` 参数完全一致。编程写入 `model` 不触发 `change`，只触发 `UForm` 的 `field:update`。
- 校验行为 — Item 带 `field` 时注册进表单：`model[field]` 每次变化自动重新校验（`reset()` 期间抑制）；异步 `validator` 采用递增序号，仅采纳最新一次结果。错误文本渲染在内容区下方，`readonly` 或表单 `noTips` 时不显示。
- 插槽：`label`（自定义标签内容，优先于 `label` prop）；`default`（控件或任意内容）。
- 暴露 — 无公开方法；`FormItemExposed` 为空类型，模板 ref 上无可调用成员。

## 典型示例

### 多控件组合同一字段

```vue
<script setup lang="ts">
import { UForm, UFormItem, UInput } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/form-item/style'
import '@veltra/mobile/components/input/style'

const formData = reactive({ dateRange: { startDate: '', endDate: '' } })
</script>

<template>
  <UForm :model="formData">
    <UFormItem
      label="日期范围"
      field="dateRange"
      :rules="{
        validator: (val) => (!val.startDate || !val.endDate ? '请选择完整的起止日期' : '')
      }"
    >
      <UInput v-model="formData.dateRange.startDate" placeholder="开始日期" />
      <span> 至 </span>
      <UInput v-model="formData.dateRange.endDate" placeholder="结束日期" />
    </UFormItem>
  </UForm>
</template>
```

### 包裹控件并转换字段值（开关）

把 `field` 写在 `UFormItem` 上即可获得 label 与校验；内部控件用 `:model-value` / `@update:model-value` 自行完成读时归一与写时转换。`USwitch` 只接受布尔值，当字段允许 `undefined`（未设置）且约定 `undefined` 与 `true` 都显示为「开」时，必须这样转换。

```vue
<script setup lang="ts">
import { UForm, UFormItem, USwitch } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/form-item/style'
import '@veltra/mobile/components/switch/style'

// status 允许 undefined（未设置，视为开）
const formData = reactive({ status: undefined as boolean | undefined })
</script>

<template>
  <UForm :model="formData">
    <UFormItem label="启用状态" field="status">
      <!-- undefined 与 true 都为「开」；写入时统一落成布尔值 -->
      <USwitch
        :model-value="formData.status === undefined || formData.status === true"
        @update:model-value="(val) => (formData.status = val)"
      />
    </UFormItem>
  </UForm>
</template>
```

### 自定义 label 插槽与单项位置覆盖

```vue
<script setup lang="ts">
import { UCheckbox, UForm, UFormItem } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/form-item/style'
import '@veltra/mobile/components/checkbox/style'

const formData = reactive({ agree: false })
</script>

<template>
  <UForm :model="formData">
    <UFormItem field="agree">
      <template #label>
        <span>我已阅读并同意条款</span>
      </template>
      <UCheckbox v-model="formData.agree" />
    </UFormItem>
  </UForm>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端 `labelPosition` **默认 `'left'` 行式**：label 左、控件占右侧剩余宽度、行高约 48px、相邻行细分隔线、整行热区 ≥44px；`'top'` 时 label 纵向堆叠（适合文本域等长控件）。`labelWidth` 仅 `'left'` 时生效。
> - 移动端校验反馈是**行内下方红色文本**（不弹桌面悬浮 tooltip）；嵌入控件区的 input / number-input / password-input 等自动呈行式形态（透明底、去边框、占满控件区）。
> - 移动端不渲染 `tips` 悬浮提示（桌面端 hover 500ms 显示），`tips` 声明保留。
> - 移动端 `span` 不生效（UForm 单列呈现），声明保留。
> - 本库的组合字段写法是 `field` 写在 `UFormItem`、内部控件用 `v-model`（值需转换时用 `:model-value` / `@update:model-value`），**不是**控件上再写一遍 `field`；控件带 `field` 会被 `UForm` 拦截成独立表单项，导致双重绑定。
> - 单字段控件只需在控件上写 `field`：`UForm` 自动生成 `UFormItem`，并把控件上的 `label` / `rules` / `span` / `tips` / `readonly` / `field` 透传给该表单项。仅在控件值需转换、多控件组合一个字段、自定义 label 这几种场景才手写 `UFormItem`。
> - `UFormItem` 必须位于 `UForm` 内：校验依赖表单注入的 `model` 与 `validateFields`，脱离表单时 `rules` 静默不校验。
> - 与 Element Plus / Ant Design 不同，本库不需要为每个字段手写表单项容器；给单个控件套 `UFormItem` 且内部控件再写 `field` 是错误的双包写法。
> - 内部控件 `change` 冒泡为 Item 的 `change`；编程写入 `model` 只触发 `UForm` 的 `field:update`，监听不到 `change`。

## 常见问题

### label 与校验都不出现

label 不出现的原因是没传 `label` prop 也没有 `#label` 插槽——label 渲染只看这两者，与 `field` 无关；校验不生效才与漏写 `field` 有关（`field` 缺失时字段不注册进表单、校验与 model 联动不工作）。修复：要 label 就传 `label` prop 或 `#label` 插槽；要校验就补上与 `model` 对应的字段路径，如 `field="priceRange"`。

### `labelWidth` 没有效果

原因：该项（或所在 UForm）的 `labelPosition` 为 `'top'`，该模式下忽略 `labelWidth`、label 按内容自适应。修复：保持默认 `'left'`（或显式传 `label-position="left"`）后 `labelWidth` 才生效。

```vue
<script setup lang="ts">
import { UForm, UFormItem, USwitch } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/form-item/style'
import '@veltra/mobile/components/switch/style'

const formData = reactive({ enabled: false })
</script>

<template>
  <UForm :model="formData" :label-width="80">
    <UFormItem label="启用" field="enabled">
      <USwitch v-model="formData.enabled" />
    </UFormItem>
  </UForm>
</template>
```

### 换了 `field` 值后旧字段仍在校验

原因：`field` 动态变更会先注销旧字段再注册新字段，若新旧 Item 同时存在且指向同一 `field` 会相互覆盖注册。修复：保证同一 `field` 同一时刻只有一个 `UFormItem`（或带 `field` 的控件）在渲染，用 `v-if` 切换时配合 `key`。
