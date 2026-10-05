---
title: UForm 表单（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端表单容器：拦截插槽中带 field 的控件，自动生成 UFormItem 并按 field 路径读写 model，无需手写表单项、也不在控件上用 v-model（区别于 Element Plus / Ant Design）。提供全量/按字段校验（失败滚动到首条错误）、reset、showModified 变更前纯文本展示与 field:update 字段事件；列表行式卡片布局（label 左、控件右、行高约 48px、行间细分隔线），支持 title 分组标题。'
aliases: ['UForm', 'Form', 'el-form', '表单容器', '移动端表单']
keywords:
  - field
  - field:update
  - UFormItem
  - v-model
  - modelValue
  - showModified
  - initialModel
  - reset
  - validate
  - clearValidate
  - labelPosition
  - labelWidth
  - title
  - 分组标题
  - 变更前
  - 表单校验
  - 按字段校验
  - 重置表单
  - 滚动到错误
  - 移动端表单
---

# UForm 表单（@veltra/mobile 移动端）

`@veltra/mobile` 导出表单容器组件 `UForm`。它拦截默认插槽中带 `field` 属性的表单控件，自动生成 `UFormItem` 并按 `field` 路径双向读写 `model`；提供 `validate()` 全量/按字段校验、`reset()` 重置、`showModified` 变更前展示，以及 `field:update`（model 写入）字段事件。移动端为**边框卡片式列表行式布局**：label 左、控件占右侧剩余宽度、行高约 48px、相邻行细分隔线，`labelPosition` 默认 `'left'`；`title` / `#header` 插槽渲染分组标题。

本库表单与 Element Plus / Ant Design 等开源库的用法不同：**不需要为每个字段手写 `el-form-item` / `Form.Item`，也不在控件上写 `v-model`**——把表单系列控件直接放进 `UForm`、写 `field` 即完成绑定与校验。只有两种场景才显式使用 `UFormItem`：控件值需转换后才能落库，或多个控件组合成一个字段（见 `agent-docs/mobile/form-item.md`）。

## 快速上手

`model` 传 `reactive` 对象；控件用 `field` 绑定字段，**有 `field` 就不要再写 `v-model`**。

```vue
<script setup lang="ts">
import type { FormExposed } from '@veltra/mobile'
import { UButton, UForm, UInput } from '@veltra/mobile'
import { reactive, shallowRef } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/input/style'
import '@veltra/mobile/components/button/style'

const formRef = shallowRef<FormExposed>()
const formData = reactive({ username: '', email: '' })

async function handleSubmit() {
  const valid = await formRef.value?.validate() // 异步，返回 Promise<boolean>
  if (valid) console.log('提交', formData) // => 校验通过后的 formData
}
</script>

<template>
  <UForm ref="formRef" :model="formData">
    <UInput label="用户名" field="username" :rules="{ required: '用户名不能为空' }" />
    <UInput label="邮箱" field="email" :rules="{ required: true, preset: 'email' }" />
  </UForm>
  <UButton type="primary" @click="handleSubmit">提交</UButton>
</template>
```

视觉初始化前提：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。组件按需样式引入路径为 `@veltra/mobile/components/form/style`。

字段路径支持嵌套写法 `a.b`，对应 `model.a.b`。校验规则的完整取值见 `agent-docs/mobile/form-item.md` 的 `ValidateRule`。

## API 签名

```ts
// 以下公共类型定义来自 @veltra/utils（@veltra/mobile 未再导出，此处仅说明 prop 类型）
export type ComponentSize = 'small' | 'default' | 'large'

/** 表单组件属性（FormProps 继承的 ComponentProps 已展开） */
export interface FormProps {
  /** 组件尺寸，经 form context 下发到控件。默认 'default' */
  size?: ComponentSize
  /**
   * 自定义表单列数
   * - 移动端单列呈现，该属性不生效
   */
  cols?: number
  /** 分组标题；渲染在卡片列表顶部，与 #header 插槽二选一，插槽优先 */
  title?: string
  /** 表单数据；控件按 field 路径读写该对象。不传时控件写入被丢弃 */
  model?: Record<string, any>
  /** 开启后，字段当前值与基准值不同时，在控件下方展示「变更前」。默认 false */
  showModified?: boolean
  /** 「变更前」标签文案。默认 '变更前：' */
  modifiedLabel?: string
  /** 变更前基准数据；未传时回退到 model 引用首次传入时的快照（与 reset 一致） */
  initialModel?: Record<string, any>
  /**
   * 表单项 label 宽度；number 单位 px
   * - 传了该值各行 label 固定宽对齐
   * - 未传（也未在 UFormItem 上传）时 label 按内容自适应宽度
   */
  labelWidth?: string | number
  /** 表单项 label 位置。默认 'left' 行式（label 左、控件右）；'top' 时 label 在控件上方 */
  labelPosition?: 'top' | 'left'
  /** 是否不显示校验错误提示。默认 false */
  noTips?: boolean
  /** 是否只读；下发到全部控件（控件自身 readonly 优先），并隐藏错误提示 */
  readonly?: boolean
  /** 是否禁用；下发到全部控件（控件自身 disabled 优先） */
  disabled?: boolean
}

/** 表单组件事件 */
export interface FormEmits {
  /** model 字段值更新时触发，含编程写入、回显、reset */
  (e: 'field:update', field: string, value: any): void
}

/**
 * 模板 ref 上可直接访问的成员（源码中经 DeconstructValue 解包 _FormExposed）：
 * const formRef = shallowRef<FormExposed>() 后用 formRef.value?.validate()
 */
export interface FormExposed {
  /** 表单根元素（<form> 标签）；FormExposed 经 DeconstructValue 解包，直接就是元素本身 */
  el: HTMLElement | null | undefined
  /** 校验，异步；见「方法与事件」 */
  validate: (keys?: string[]) => Promise<boolean>
  /** 清除全部校验错误，同步 */
  clearValidate: () => void
  /** 将 model 恢复为最近一次 props.model 引用变更时的快照，并清除校验 */
  reset: () => void
}
```

## 参数说明

| 参数            | 类型                              | 默认         |        必填        | 约束                                                                       |
| --------------- | --------------------------------- | ------------ | :----------------: | -------------------------------------------------------------------------- |
| `model`         | `Record<string, any>`             | —            | 是（field 绑定时） | 必须传 `reactive` 对象；不传时 `field` 绑定与 `field:update` 均不工作      |
| `cols`          | `number`                          | —            |         否         | 声明保留（与 desktop 对齐）；移动端固定单列呈现，不生效                    |
| `size`          | `'small' \| 'default' \| 'large'` | `'default'`  |         否         | 下发到控件；控件自身 `size` 优先                                           |
| `title`         | `string`                          | —            |         否         | 分组标题，渲染在卡片列表顶部；与 `#header` 插槽二选一，插槽优先           |
| `showModified`  | `boolean`                         | `false`      |         否         | 开启后逐字段对比当前值与基准值，不同则在控件下方以**纯文本**展示基准值     |
| `modifiedLabel` | `string`                          | `'变更前：'` |         否         | 仅 `showModified` 开启时渲染                                               |
| `initialModel`  | `Record<string, any>`             | model 引用快照 |        否         | 变更判定基准，优先于 reset 快照；结构须与 `model` 字段对应               |
| `labelWidth`    | `string \| number`                | 内容自适应   |         否         | number 单位 px；传了固定宽对齐，未传时 label 按内容自适应（不再回退全局配置 100px） |
| `labelPosition` | `'top' \| 'left'`                 | `'left'`     |         否         | 默认 `'left'` 行式（label 左、控件右、行高约 48px、行间细分隔线）；`'top'` 时 label 在控件上方 |
| `noTips`        | `boolean`                         | `false`      |         否         | `true` 时隐藏全部校验错误文本                                              |
| `readonly`      | `boolean`                         | `false`      |         否         | 下发控件并显示只读态；错误提示区隐藏                                       |
| `disabled`      | `boolean`                         | `false`      |         否         | 下发控件；控件自身 `disabled` 优先                                         |

## 方法与事件

模板 ref（`FormExposed`，成员已解包可直接调用）：

- `validate(keys?: string[]): Promise<boolean>` — **异步**。不传 `keys` 校验全部已注册字段；传 `keys` 仅校验指定字段，列表外与不存在的字段视为通过。返回 `Promise<boolean>`，全部通过为 `true`。失败时等 `nextTick` 后把首个错误文本（`.um-form-item__error-text`）滚动到视口中央（`scrollIntoView({ block: 'center' })`），保证小屏上错误可见。仅声明了 `field` 且带 `rules` 的字段参与校验。字段值每次变化会自动重校验，`reset()` 期间抑制。
- `clearValidate(): void` — **同步**。清空全部字段的错误文本。
- `reset(): void` — **同步**。把 `model` 按字段恢复为最近一次 `props.model` **引用**变更时的快照（浅监听，替换整个 model 对象才会刷新快照；递归恢复普通对象、数组深拷贝），随后清除校验并抑制本次触发的重校验。`model` 或快照缺失时为空操作。恢复写入会触发 `field:update`。
- `el: HTMLElement | null | undefined` — 表单根 `<form>` 元素。`FormExposed` 经 `DeconstructValue` 解包了 `ShallowRef`，`formRef.value.el` 直接就是元素，无需再取 `.value`。

事件：

- `field:update(field, value)` — `model[field]` 的任何值变化触发：用户编辑、编程写入（`Object.assign`、逐字段赋值）、回显、`reset()`。参数固定为 `(field, value)`。只对生成了 `UFormItem` 的字段（控件带 `field`）生效。

## 典型示例

### 校验、按字段校验与重置

```vue
<script setup lang="ts">
import type { FormExposed } from '@veltra/mobile'
import { UButton, UForm, UInput, UNumberInput } from '@veltra/mobile'
import { reactive, shallowRef } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/input/style'
import '@veltra/mobile/components/number-input/style'
import '@veltra/mobile/components/button/style'

const formRef = shallowRef<FormExposed>()
const formData = reactive({ username: '', email: '', age: 18 })

async function handleSubmit() {
  // 全量校验：失败自动滚动到第一个错误项
  const valid = await formRef.value?.validate()
  if (valid) console.log('提交', formData)
}

async function handleSaveDraft() {
  // 只校验用户名，邮箱/年龄不参与
  const valid = await formRef.value?.validate(['username'])
  if (valid) console.log('存草稿', formData)
}

function handleReset() {
  // 恢复为最近一次 formData 引用变更时的快照，并清除校验
  formRef.value?.reset()
}
</script>

<template>
  <UForm ref="formRef" :model="formData">
    <UInput
      label="用户名"
      field="username"
      :rules="{ required: '用户名不能为空', minLen: [2, '至少 2 个字符'] }"
    />
    <UInput label="邮箱" field="email" :rules="{ required: true, preset: 'email' }" />
    <UNumberInput label="年龄" field="age" :min="0" :max="150" :rules="{ min: 0, max: 150 }" />
  </UForm>
  <UButton type="primary" @click="handleSubmit">提交</UButton>
  <UButton @click="handleSaveDraft">存草稿</UButton>
  <UButton @click="handleReset">重置</UButton>
</template>
```

### label 位置与宽度、分组标题

移动端默认行式：label 在左、控件占右侧剩余宽度；传 `label-width` 后各行 label 固定宽对齐；长控件（文本域等）单项或表单整体用 `label-position="top"`。`title`（或 `#header` 插槽）渲染分组标题。

```vue
<script setup lang="ts">
import { UForm, UInput, USelect } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/input/style'
import '@veltra/mobile/components/select/style'

const formData = reactive({ account: '', role: undefined as string | undefined })

const roles = [
  { label: '管理员', value: 'admin' },
  { label: '成员', value: 'member' }
]
</script>

<template>
  <UForm :model="formData" title="账号信息" :label-width="88">
    <UInput label="账号" field="account" :rules="{ required: true }" />
    <USelect label="角色" field="role" :options="roles" />
  </UForm>
</template>
```

### showModified 变更前展示

基准优先取 `initialModel`；未传时取最近一次 `model` 引用变更的快照（与 `reset()` 同源）。变更判定：`null`、`undefined`、`''` 三者视为相同；对象与数组经 `JSON.stringify` 序列化后比较；其余值不相等即已变更。移动端「变更前」按**纯文本**渲染（数组以 `、` 连接、对象输出 JSON，空值显示 `-`），不克隆只读控件。

```vue
<script setup lang="ts">
import type { FormExposed } from '@veltra/mobile'
import { UButton, UForm, UInput, UMultiSelect } from '@veltra/mobile'
import { reactive, shallowRef } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/input/style'
import '@veltra/mobile/components/multi-select/style'
import '@veltra/mobile/components/button/style'

const formRef = shallowRef<FormExposed>()
// 基准数据与 model 初始值保持一致
const initialModel = { title: '原标题', scope: ['fe'] }
const formData = reactive({ title: '原标题', scope: ['fe'] as string[] })

const tags = [
  { label: '前端', value: 'fe' },
  { label: '后端', value: 'be' },
  { label: '设计', value: 'design' }
]

function handleReset() {
  formRef.value?.reset() // 恢复 formData 快照；「变更前」展示仍以 initialModel 为基准
}
</script>

<template>
  <UForm
    ref="formRef"
    :model="formData"
    :initial-model="initialModel"
    show-modified
    modified-label="初始值："
  >
    <UInput label="标题" field="title" />
    <UMultiSelect label="范围" field="scope" :options="tags" />
  </UForm>
  <UButton @click="handleReset">重置</UButton>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是**边框卡片式列表行式布局**：label 左、控件占右侧剩余宽度、行高约 48px、相邻行细分隔线、整行热区 ≥44px；`cols` 与控件上的 `span` 声明保留（与 desktop 对齐）但当前实现不生效。
> - 移动端 `labelPosition` **默认 `'left'` 行式**，桌面端同样默认 `'left'` 但为多列栅格；`labelWidth` 仅 `labelPosition='left'` 时生效，未传时 label 按内容自适应宽度（不回退全局配置）。
> - 移动端「变更前」是**纯文本行**（数组以 `、` 连接、对象输出 JSON、空值显示 `-`）；桌面端是克隆的只读控件副本。
> - 本库表单的绑定方式是「单字段控件写 `field`」，**不是** Element Plus / Ant Design 那样为每个字段外层手写 `el-form-item` / `Form.Item` 再给控件 `v-model`。单字段场景不要手写外层表单项（`UForm` 会自动生成）；只有值转换与多控件组合才手写 `UFormItem`。
> - `field` 与 `v-model`（`modelValue`）互斥：**有 `field` 就禁止再写 `v-model`**。并用时显示值来自 `v-model`，修改还会同时写入 `model`，出现两份状态。
> - `label` / `rules` / `tips` / `span` 是 FormComponentProps，仅当控件位于 `UForm` 内（或包在 `UFormItem` 中）才生效；移动端 `tips` 不渲染悬浮提示。
> - `reset()` 恢复的是最近一次 `model` **引用**变更时的快照，不是清空；`showModified` 的基准优先取 `initialModel`。两者传入不同对象时，`reset()` 后字段值与「变更前」展示值可以不同。
> - `model` 未传时，控件的修改不会写回任何对象，`field:update` 也不触发。
> - 表单根元素是 `<form>` 且已阻止原生提交（`@submit.prevent`），回车不会刷新页面。

## 常见问题

### 控件不回显、值不进 model

原因：控件同时写了 `v-model` 与 `field`，或漏写 `field`。修复：删除 `v-model`，仅保留 `field`：

```vue
<script setup lang="ts">
import { UForm, UInput } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/input/style'

const formData = reactive({ name: '' })
</script>

<template>
  <UForm :model="formData">
    <!-- 错误：<UInput v-model="formData.name" label="姓名" field="name" /> -->
    <UInput label="姓名" field="name" />
  </UForm>
</template>
```

### 调用 `validate()` 直接返回 `true`，规则没生效

原因：字段未写 `rules`，或控件未写 `field`（未生成 `UFormItem`，不参与校验）。修复：控件补 `field`，规则写在控件的 `rules` 上。

### 设置了 `cols` 但表单没有变成多列

移动端固定单列呈现，`cols` 声明保留但不生效。需要多列布局时在 `UForm` 外自行组织布局容器。

### `reset()` 之后「变更前」展示的值与字段值不一致

原因：`reset()` 的快照来自 `model` 引用变更，而「变更前」基准优先取 `initialModel`。修复：把 `initialModel` 与 `model` 的初始值保持一致（如都用同一份字面量生成）；不需要「变更前」展示时不传 `showModified`。
