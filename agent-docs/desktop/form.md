---
title: UForm 表单
description: "表单容器组件：拦截插槽中带 field 的控件，自动生成表单项并按 field 路径读写 model，无需手写表单项、也不在控件上用 v-model（区别于 Element Plus / Ant Design）；字段值需转换或多控件组合时用 UFormItem 绑定 field。另提供全量/按字段校验、reset、showModified 与 field:change / field:update 字段事件。"
aliases: ["UForm", "Form", "el-form", "表单容器"]
keywords:
  - field
  - field:change
  - field:update
  - UFormItem
  - v-model
  - modelValue
  - showModified
  - initialModel
  - reset
  - validate
  - clearValidate
  - labelWidth
  - 字段联动
  - 变更前
  - 表单校验
  - 重置表单
  - 按字段校验
  - 组合字段
  - 开关字段
  - 字段值转换
---

# UForm 表单

`@veltra/desktop` 导出表单容器组件 `UForm`。它拦截默认插槽中带 `field` 属性的表单控件，自动生成 `UFormItem` 并按 `field` 路径双向读写 `model`；提供 `validate()` 全量/按字段校验、`reset()` 重置、`showModified` 变更前展示，以及 `field:change`（用户操作）与 `field:update`（model 写入）两类字段事件。

本库表单与 Element Plus / Ant Design 等开源库的用法不同：**不需要为每个字段手写 `el-form-item` / `Form.Item`，也不在控件上写 `v-model`**——把表单系列控件直接放进 `UForm`、写 `field` 即完成绑定与校验。只有两种场景才显式使用 `UFormItem`：控件值需转换后才能落库（如开关的 `undefined`/`true` 归一为布尔值），或多个控件组合成一个字段。详见「典型示例 · 自定义控件绑定字段（值转换）」与「典型示例 · 多控件组合一个字段」。

## 快速上手

`model` 传 `reactive` 对象；控件用 `field` 绑定字段，**有 `field` 就不要再写 `v-model`**。独立页面需先初始化主题（`import '@veltra/styles/normalize'` + `loadTheme()`），SFC 片段场景无需重复。

```vue
<script setup lang="ts">
import type { FormExposed } from '@veltra/desktop'
import { UButton, UForm, UInput } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

const formRef = shallowRef<FormExposed>()
const formData = reactive({ username: '', email: '' })

async function handleSubmit() {
  const valid = await formRef.value?.validate() // 异步，返回 Promise<boolean>
  if (valid) console.log('提交', formData) // => 校验通过后的 formData
}
</script>

<template>
  <u-form ref="formRef" :model="formData" label-width="100px" :cols="1">
    <u-input label="用户名" field="username" :rules="{ required: '用户名不能为空' }" />
    <u-input label="邮箱" field="email" :rules="{ required: true, preset: 'email' }" />
  </u-form>
  <u-button type="primary" @click="handleSubmit">提交</u-button>
</template>
```

字段路径支持嵌套写法 `a.b`，对应 `model.a.b`。校验规则的完整取值见 `agent-docs/desktop/form-item.md` 的 `ValidateRule`。

## API 签名

```ts
import type { ShallowRef } from 'vue'

export type ComponentSize = 'small' | 'default' | 'large'

/** 表单组件属性 */
export interface FormProps {
  /** 组件尺寸，经 form context 下发到控件。默认 'default' */
  size?: ComponentSize
  /**
   * 自定义表单列数（CSS 栅格列数，正整数）
   * - 不传时按断点自动排列：xs 1 列、md 2 列、lg 3 列、xl 及以上 4 列
   */
  cols?: number
  /** 表单数据；控件按 field 路径读写该对象。不传时控件写入被丢弃 */
  model?: Record<string, any>
  /** 开启后，字段当前值与基准值不同时，在控件下方展示「变更前」。默认 false */
  showModified?: boolean
  /** 「变更前」标签文案。默认 '变更前：' */
  modifiedLabel?: string
  /** 变更前基准数据；未传时回退到最近一次 model 引用变更时的快照（与 reset 一致） */
  initialModel?: Record<string, any>
  /** 表单项 label 宽度；number 单位 px，string 原样使用（如 '110px'）。未传时回退全局配置 config.form.labelWidth（默认 100） */
  labelWidth?: string | number
  /** 表单项 label 位置。默认 'left'；'top' 时 label 在上方且不追加冒号 */
  labelPosition?: 'top' | 'left'
  /** 是否不显示校验错误提示。默认 false */
  noTips?: boolean
  /** 是否只读；下发到全部控件（控件自身 readonly 优先），并隐藏错误提示区 */
  readonly?: boolean
  /** 是否禁用；下发到全部控件（控件自身 disabled 优先） */
  disabled?: boolean
}

/** 表单组件事件 */
export interface FormEmits {
  /** 控件 change 事件，仅用户操作控件时触发；args 与控件 change 参数一致 */
  (e: 'field:change', field: string, ...args: any[]): void
  /** model 字段值更新时触发，含编程写入、回显、reset */
  (e: 'field:update', field: string, value: any): void
}

/**
 * 模板 ref 上可直接访问的成员（源码中经 DeconstructValue 解包 _FormExposed）：
 * const formRef = shallowRef<FormExposed>() 后用 formRef.value?.validate()
 */
export interface FormExposed {
  /** 表单根元素（<form> 标签） */
  el: ShallowRef<HTMLElement | null | undefined>
  /** 校验，异步；见「方法与事件」 */
  validate: (keys?: string[]) => Promise<boolean>
  /** 清除全部校验错误，同步 */
  clearValidate: () => void
  /** 恢复 model 为最近一次 props.model 引用变更时的快照，并清除校验 */
  reset: () => void
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `model` | `Record<string, any>` | — | 是（field 绑定时） | 必须传 `reactive` 对象；不传时 `field` 绑定与 `field:update` 均不工作 |
| `cols` | `number` | 断点自动 | 否 | 正整数；传入后所有断点固定该列数，不传按 xs 1 / md 2 / lg 3 / xl 4 自动排列 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 下发到控件；控件自身 `size` 优先 |
| `showModified` | `boolean` | `false` | 否 | 开启后逐字段对比当前值与基准值，不同则在控件下方以只读控件展示基准值 |
| `modifiedLabel` | `string` | `'变更前：'` | 否 | 仅 `showModified` 开启时渲染 |
| `initialModel` | `Record<string, any>` | model 引用快照 | 否 | 变更判定基准，优先于 reset 快照；结构须与 `model` 字段对应 |
| `labelWidth` | `string \| number` | `100`（全局配置） | 否 | number 单位 px；string 原样（如 `'110px'`、`'10em'`） |
| `labelPosition` | `'top' \| 'left'` | `'left'` | 否 | `'left'` 时 label 追加冒号；`'top'` 不追加且忽略宽度 |
| `noTips` | `boolean` | `false` | 否 | `true` 时隐藏全部校验错误文本 |
| `readonly` | `boolean` | `false` | 否 | 下发控件并显示只读态；错误提示区隐藏 |
| `disabled` | `boolean` | `false` | 否 | 下发控件；控件自身 `disabled` 优先 |

## 方法与事件

模板 ref（`FormExposed`，成员已解包可直接调用）：

- `validate(keys?: string[]): Promise<boolean>` — **异步**。不传 `keys` 校验全部已注册字段；传 `keys` 仅校验指定字段，列表外与不存在的字段视为通过。返回 `Promise<boolean>`，全部通过为 `true`。失败时等 `nextTick` 后把首个错误文本（`.u-form-item__error-text`）滚动到视口中央。仅声明了 `field` 且带 `rules` 的字段参与校验。字段值每次变化会自动重校验，`reset()` 期间抑制。
- `clearValidate(): void` — **同步**。清空全部字段的错误文本。
- `reset(): void` — **同步**。把 `model` 按字段恢复为最近一次 `props.model` **引用**变更时的快照（浅监听，替换整个 model 对象才会刷新快照；递归恢复普通对象、数组深拷贝），随后清除校验并抑制本次触发的重校验。`model` 或快照缺失时为空操作。恢复写入会触发 `field:update`，不触发 `field:change`。
- `el: ShallowRef<HTMLElement | null | undefined>` — 表单根 `<form>` 元素。

事件：

- `field:change(field, ...args)` — 仅用户操作控件触发（控件 `change` 经 FormItem 冒泡）；`args` 与该控件 `change` 事件的参数一致（如 UCheckbox 为勾选值）。编程写入 `model`、回显、`reset` **不触发**。字段联动监听它，可避免切行回显误触发。
- `field:update(field, value)` — `model[field]` 的任何值变化触发：用户编辑、编程写入（`Object.assign`、逐字段赋值）、回显、`reset()`。参数固定为 `(field, value)`。

两个事件均只对生成了 `UFormItem` 的字段（控件带 `field`）生效。

## 典型示例

### 校验、按字段校验与重置

```vue
<script setup lang="ts">
import type { FormExposed } from '@veltra/desktop'
import { UButton, UForm, UInput, UNumberInput } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

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

function handleClearValidate() {
  formRef.value?.clearValidate()
}
</script>

<template>
  <u-form ref="formRef" :model="formData" label-width="100px" :cols="1">
    <u-input
      label="用户名"
      field="username"
      :rules="{ required: '用户名不能为空', minLen: [2, '至少 2 个字符'] }"
    />
    <u-input label="邮箱" field="email" :rules="{ required: true, preset: 'email' }" />
    <u-number-input label="年龄" field="age" :min="0" :max="150" :rules="{ min: 0, max: 150 }" />
  </u-form>
  <u-button type="primary" @click="handleSubmit">提交</u-button>
  <u-button @click="handleSaveDraft">存草稿</u-button>
  <u-button @click="handleClearValidate">清除校验</u-button>
  <u-button @click="handleReset">重置</u-button>
</template>
```

### field:change 与 field:update 字段联动

`field:change` 仅用户操作触发，适合联动；`field:update` 覆盖一切 model 写入（编程写入、回显、`reset`），适合同步副作用。切行回显场景监听 `field:change` 不会误触发。

```vue
<script setup lang="ts">
import type { FormExposed } from '@veltra/desktop'
import { UForm, UInput, USelect } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

const formRef = shallowRef<FormExposed>()
const formData = reactive({ department: '', position: '', remark: '' })

// 用户改动部门时联动清空职位；回显/重置不会走进来
function onFieldChange(field: string, ...args: any[]) {
  if (field === 'department') {
    formData.position = ''
    formData.remark = `部门已切到 ${args[0]}`
  }
}

// 任何写入（含上面这行编程赋值、reset 恢复）都会触发
function onFieldUpdate(field: string, value: any) {
  console.log(field, value) // => 'position' ''
}

const departments = [
  { label: '技术部', value: 'tech' },
  { label: '市场部', value: 'marketing' }
]
</script>

<template>
  <u-form ref="formRef" :model="formData" label-width="100px" :cols="1" @field:change="onFieldChange" @field:update="onFieldUpdate">
    <u-select label="部门" field="department" :options="departments" />
    <u-input label="职位" field="position" />
    <u-input label="备注" field="remark" />
  </u-form>
</template>
```

### showModified 变更前展示

基准优先取 `initialModel`；未传时取最近一次 `model` 引用变更的快照（与 `reset()` 同源）。变更判定：`null`、`undefined`、`''` 三者视为相同；对象与数组经 `JSON.stringify` 序列化后比较；其余值不相等即已变更。

```vue
<script setup lang="ts">
import type { FormExposed } from '@veltra/desktop'
import { UButton, UForm, UInput, UNumberInput } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

const formRef = shallowRef<FormExposed>()
// 基准数据与 model 初始值保持一致
const initialModel = { name: '默认名称', qty: 1, tags: ['new'] }
const formData = reactive({ name: '默认名称', qty: 1, tags: ['new'] })

function handleReset() {
  formRef.value?.reset() // 恢复 formData 快照；「变更前」展示仍以 initialModel 为基准
}
</script>

<template>
  <u-form
    ref="formRef"
    :model="formData"
    :initial-model="initialModel"
    show-modified
    modified-label="初始值："
    label-width="100px"
    :cols="1"
  >
    <u-input label="名称" field="name" />
    <u-number-input label="数量" field="qty" :min="1" />
    <u-input label="标签" field="tags" />
  </u-form>
  <u-button @click="handleReset">重置</u-button>
</template>
```

### 自定义控件绑定字段（值转换：开关的 undefined / true 均视为开）

需要把控件值转换成字段值时，写 `field` 的自动绑定不再适用，改为「外层 `UFormItem` 绑 `field` + 内层控件自行处理 `modelValue` / `update:modelValue`」：`UFormItem` 提供 label、必填与校验（校验读的是 `model[field]`），控件负责在读时归一、写时转换。

`USwitch` 的 `modelValue` 是布尔值，本库没有 `activeValue` / `inactiveValue`。因此当 `status` 为 `undefined` 或 `true` 时都应显示为「开」，需要在写入时把开关值统一落成布尔值，并禁止在控件上写 `field`（否则会被 `UForm` 再包一层 `UFormItem`，形成双重绑定）。

```vue
<script setup lang="ts">
import { UForm, UFormItem, USwitch } from '@veltra/desktop'
import { reactive } from 'vue'

// status 允许 undefined（未设置，视为开）
const formData = reactive({ status: undefined as boolean | undefined })
</script>

<template>
  <u-form :model="formData" label-width="100px" :cols="1">
    <!-- field 写在 UFormItem：label / rules / 校验都挂在这里，读的也是 formData.status -->
    <u-form-item label="启用状态" field="status">
      <!-- 值转换：undefined 与 true 都为「开」；写入时统一落成布尔值 -->
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

若字段需要自定义校验，校验写在 `UFormItem` 的 `rules` 上：

```vue
<script setup lang="ts">
import { UForm, UFormItem, USwitch } from '@veltra/desktop'
import { reactive } from 'vue'

const formData = reactive({ enabled: undefined as boolean | undefined })
</script>

<template>
  <u-form :model="formData" :cols="1">
    <u-form-item
      label="启用"
      field="enabled"
      :rules="{ validator: (v) => (v === undefined ? '请选择启用状态' : '') }"
    >
      <u-switch
        :model-value="formData.enabled === undefined || formData.enabled === true"
        @update:model-value="(val) => (formData.enabled = val)"
      />
    </u-form-item>
  </u-form>
</template>
```

### 多控件组合一个字段

一个字段由多个控件拼成时，`field` 写在 `UFormItem` 上，内部控件各自 `v-model` 绑定 `model` 的路径，**内部控件不要再写 `field`**。校验与 label 由外层 `UFormItem` 负责。

```vue
<script setup lang="ts">
import { UForm, UFormItem, UNumberInput } from '@veltra/desktop'
import { reactive } from 'vue'

const formData = reactive({
  sizeRange: { min: undefined as number | undefined, max: undefined as number | undefined }
})
</script>

<template>
  <u-form :model="formData" label-width="100px" :cols="1">
    <u-form-item
      label="尺寸区间"
      field="sizeRange"
      :rules="{ validator: (v) => (v && v.min != null && v.max != null && v.min > v.max ? '最小尺寸不能大于最大尺寸' : '') }"
    >
      <u-number-input v-model="formData.sizeRange.min" placeholder="最小" />
      <span>—</span>
      <u-number-input v-model="formData.sizeRange.max" placeholder="最大" />
    </u-form-item>
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
> - 本库表单的绑定方式是「单字段控件写 `field`」，**不是** Element Plus / Ant Design 那样为每个字段外层手写 `el-form-item` / `Form.Item` 再给控件 `v-model`。单字段场景不要手写外层表单项（`UForm` 会自动生成）；只有值转换与多控件组合才手写 `UFormItem`。
> - `field` 与 `v-model`（`modelValue`）互斥：**有 `field` 就禁止再写 `v-model`**。并用时显示值来自 `v-model`，修改还会同时写入 `model`，出现两份状态。
> - 控件值需要转换（如开关把 `undefined`/`true` 归一为布尔值）或多控件组合成一个字段时，用 `UFormItem` 绑 `field`、内部控件自行 `v-model` 或 `:model-value`/`@update:model-value`，**内部控件不要再写 `field`**。
> - `label` / `rules` / `tips` / `span` 是 FormComponentProps，仅当控件位于 `UForm` 内（或包在 `UFormItem` 中）才生效；脱离表单写 `label` 无效。
> - 本库表单控件没有 `activeValue` / `inactiveValue` 一类的自定义开/关值（`USwitch` 只接受布尔值）；需要值转换时按「自定义控件绑定字段」示例自行映射。
> - `field:change` 语义与 1.7.9 及之前不同：旧版在 `model` 字段编程写入时也会触发且参数固定为 `(field, value)`；现在仅控件 `change`（用户操作）触发，参数与控件一致。监听 model 写入（含编程写入、回显、`reset`、`quick-edit` 回写）必须改用 `field:update`。
> - `reset()` 恢复的是最近一次 `model` **引用**变更时的快照，不是清空；`showModified` 的基准优先取 `initialModel`。两者传入不同对象时，`reset()` 后字段值与「变更前」展示值可以不同。
> - `showModified` 的变更判定：`null`、`undefined`、`''` 三者视为相同；对象与数组经 `JSON.stringify` 序列化后比较；其余值不相等即判定已变更。
> - `model` 未传时，控件的修改不会写回任何对象，`field:update` 也不触发。

表单根元素是 `<form>` 且已阻止原生提交（`@submit.prevent`），回车不会刷新页面。

## 常见问题

### 控件不回显、值不进 model

原因：控件同时写了 `v-model` 与 `field`，或漏写 `field`。修复：删除 `v-model`，仅保留 `field`：

```vue
<!-- 错误 -->
<u-input v-model="formData.name" label="姓名" field="name" />
<!-- 正确 -->
<u-input label="姓名" field="name" />
```

### 调用 `validate()` 直接返回 `true`，规则没生效

原因：字段未写 `rules`，或控件未写 `field`（未生成 `UFormItem`，不参与校验）。修复：控件补 `field`，规则写在控件的 `rules` 上。

### `reset()` 之后「变更前」展示的值与字段值不一致

原因：`reset()` 的快照来自 `model` 引用变更，而「变更前」基准优先取 `initialModel`。修复：把 `initialModel` 与 `model` 的初始值保持一致（如都用 `copy(formData)` 生成）；不需要「变更前」展示时不传 `showModified`。

### 需要把控件值转换成字段值再写入（开关、字符串与数字互转）

原因：控件直接写 `field` 时，控件的 `modelValue` 原样写入 `model[field]`，没有转换机会。修复：改用 `UFormItem` 绑 `field`，内部控件自行处理 `modelValue` 与 `update:modelValue`：

```vue
<!-- 字段是 '1' / '0'，控件是布尔开关 -->
<u-form-item label="启用" field="enabled">
  <u-switch
    :model-value="formData.enabled === '1'"
    @update:model-value="(val) => (formData.enabled = val ? '1' : '0')"
  />
</u-form-item>
```

### 照搬 Element Plus / Ant Design 写法后校验不生效

原因：这两个库要求外层显式写 `el-form-item` / `Form.Item` 并在控件上用 `v-model`；本库由 `UForm` 自动生成表单项并靠 `field` 取值。手写外层容器会让控件未被自动绑定。修复：删掉外层手写表单项，只在控件上写 `field` 与 `rules`：

```vue
<!-- 错误：手写外层容器 + v-model，校验绑不上 -->
<u-form :model="formData">
  <u-form-item label="姓名">
    <u-input v-model="formData.name" :rules="{ required: true }" />
  </u-form-item>
</u-form>
<!-- 正确：控件直接写 field 与 rules -->
<u-form :model="formData">
  <u-input label="姓名" field="name" :rules="{ required: true }" />
</u-form>
```
