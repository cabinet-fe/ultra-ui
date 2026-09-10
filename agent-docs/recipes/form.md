---
title: Ultra UI 表单场景
description: 端到端实现 Ultra UI 表单：UForm + field 绑定 model、非 field 场景（开关值转换 / 多控件组合字段）用 UFormItem、ValidateRule 校验（required/minLen/preset/validator）、field:change 字段联动、showModified 变更前展示与 reset 重置。
aliases: [表单, 表单校验, 表单联动, UForm, Form]
keywords: [UForm, UFormItem, field, ValidateRule, field:change, field:update, showModified, initialModel, reset, validate, clearValidate, required, minLen, preset, validator, 字段联动, 变更前, 表单校验, 值转换, 开关字段, 组合字段, 自定义控件]
---

# Ultra UI 表单场景

Ultra UI（`@veltra/*`）的表单方案：`UForm` 拦截默认插槽里带 `field` 的控件，自动生成 `UFormItem` 并按 `field` 路径读写 `model`。本方案覆盖字段绑定、`ValidateRule` 校验、`field:change` 字段联动、`showModified` 变更展示与 `reset`，端到端一个完整 SFC。

## 场景

- 何时用本方案：需要标签、校验、字段联动或把值写进 `model` 的表单页（新建 / 编辑 / 筛选提交）。
- 何时不用：工具栏、筛选条上的独立输入框——不包 `u-form`，控件直接 `v-model`，`label` / `rules` 此时无效。
- 何时显式包 `u-form-item`：只有两种情况——控件值需转换后才能落库（如开关把 `undefined`/`true` 归一为布尔值），或多个控件组合成一个字段。此时 `field` 写在 `u-form-item` 上，内部控件自行 `v-model`（或 `:model-value` / `@update:model-value`）且不再写 `field`。
- 本库不照搬 Element Plus / Ant Design：不需要为每个字段手写外层表单项再给控件 `v-model`；单字段控件写 `field` 即可，`UForm` 会自动生成表单项。

## 完整示例

```vue
<!-- src/views/UserForm.vue -->
<script setup lang="ts">
import type { FormExposed } from '@veltra/desktop'
import { UButton, UForm, UInput, UNumberInput, USelect } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

// 基准数据：showModified 的对比基准 + reset 的目标值都和它对齐
const initialModel = { username: '', email: '', age: 18, department: '', position: '' }
const formData = reactive({ ...initialModel })

const formRef = shallowRef<FormExposed>()

const departments = [
  { label: '技术部', value: 'tech' },
  { label: '市场部', value: 'marketing' }
]

// field:change 仅用户操作控件时触发；编程写入、回显、reset 不触发
function onFieldChange(field: string, ...args: unknown[]) {
  if (field === 'department') {
    formData.position = '' // 改部门时联动清空职位
  }
}

// field:update 覆盖一切 model 写入（含上面这行编程赋值、reset 恢复）
function onFieldUpdate(field: string, value: unknown) {
  console.log(field, value) // => 'position' ''
}

async function handleSubmit() {
  // 全量校验；失败时自动滚动到首个错误项
  const valid = await formRef.value?.validate() // => Promise<boolean>
  if (valid) console.log('提交', formData)
}

function handleReset() {
  // 恢复为最近一次 model 引用变更时的快照，并清除校验
  formRef.value?.reset()
}
</script>

<template>
  <u-form
    ref="formRef"
    :model="formData"
    :initial-model="initialModel"
    show-modified
    label-width="100px"
    :cols="1"
    @field:change="onFieldChange"
    @field:update="onFieldUpdate"
  >
    <u-input
      label="用户名"
      field="username"
      :rules="{
        required: '用户名不能为空',
        minLen: [2, '至少 2 个字符'],
        maxLen: [20, '最多 20 个字符']
      }"
    />
    <u-input label="邮箱" field="email" :rules="{ required: true, preset: 'email' }" />
    <u-number-input label="年龄" field="age" :rules="{ min: 0, max: 150 }" />
    <u-select label="部门" field="department" :options="departments" />
    <u-input label="职位" field="position" />
  </u-form>
  <u-button type="primary" @click="handleSubmit">提交</u-button>
  <u-button @click="handleReset">重置</u-button>
</template>
```

提交时若用户名为空，用户名控件下方显示「用户名不能为空」并滚动到该项；改动年龄后控件下方出现「变更前：18」；点「重置」后全部字段回到 `initialModel` 的值、错误与「变更前」一并清除。

## 要点说明

- `field` 硬规则：`u-form` 内需要标签、校验或写入 `model` 的控件必须写 `field`（支持 `a.b` 嵌套路径对应 `model.a.b`）；**有 `field` 就不要再写 `v-model`**——并用时取值来自 `v-model`、写入两份状态。
- 字段值需转换时不能用 `field` 直连，改用 `u-form-item` 绑 `field` + 内部控件自行处理 `modelValue`。典型是开关：`USwitch` 只接受布尔值（本库没有 `activeValue` / `inactiveValue`），当字段允许 `undefined` 且约定 `undefined` 与 `true` 都显示为「开」时：
  ```vue
  <u-form-item label="启用状态" field="status">
    <u-switch
      :model-value="formData.status === undefined || formData.status === true"
      @update:model-value="(val) => (formData.status = val)"
      active-text="开"
      inactive-text="关"
    />
  </u-form-item>
  ```
- 多控件组合一个字段时同样把 `field` 写在 `u-form-item` 上，内部每个控件 `v-model` 绑定 `model` 的对应路径，**内部控件不要再写 `field`**（否则会被 `UForm` 再包一层表单项）。
- `model` 必须传 `reactive` 对象；不传时 `field` 绑定与 `field:update` 均不工作。
- `ValidateRule` 五要素速查（`rules` 写在控件上）：
  - `required`：`boolean | string`，`true` 默认文案「该项不能为空」，字符串为自定义文案；最先执行。
  - `minLen` / `maxLen` / `length`（字符串/数组长度）、`min` / `max`（数字）：`number | [阈值, 错误文案]`；空值（`null`、`undefined`、`''`、空数组）跳过这些规则。
  - `match`：`RegExp | string | [RegExp, string]` 正则匹配。
  - `preset`：`'email' | 'phone' | 'num' | 'url' | 'idCard'` 预设规则，如 `preset: 'email'`。
  - `validator`：`(value, data) => Promise<string> | string`，返回错误文案表示不通过、空串或 resolve 空表示通过；最后执行。
- `field:change` 与 `field:update` 分工：`field:change(field, ...args)` 仅用户操作控件触发，`args` 与控件 `change` 参数一致，字段联动监听它可避免切行回显误触发；`field:update(field, value)` 在 model 字段任何写入时触发（用户编辑、编程写入、回显、`reset`）。
- `showModified`：开启后字段当前值与基准不同时，在控件下方展示「变更前」（文案由 `modifiedLabel` 定，默认 `'变更前：'`）。基准优先取 `initialModel`，未传时取最近一次 `model` 引用变更的快照（与 `reset` 同源）。变更判定：`null`、`undefined`、`''` 视为相同；对象与数组经 `JSON.stringify` 比较。
- `validate()` 异步返回 `Promise<boolean>`，失败滚动到首个错误项；`validate(['username'])` 只校验指定字段，列表外与不存在的字段视为通过。字段值每次变化自动重校验。
- `reset()` 同步：把 `model` 恢复为最近一次 `props.model` **引用**变更时的快照（替换整个 model 对象才刷新快照），清除校验并抑制本次重校验；恢复写入触发 `field:update`，不触发 `field:change`。`clearValidate()` 只清错误文本。

## 注意事项

> [!WARNING]
> - 本库控件在 `UForm` 内用 `field` 绑定 model，不是 `v-model`；`field` 与 `v-model` 并用是错误写法。
> - 不要照搬 Element Plus / Ant Design：不需要为每个字段手写 `el-form-item` / `Form.Item` 再给控件 `v-model`。单字段控件写 `field` 即可；只有值转换与多控件组合两种场景才手写 `u-form-item`。
> - `label` / `rules` / `tips` / `span` 只有在 `UForm` 内（或包了 `UFormItem`）才生效；脱离表单写 `label` 无效。
> - 本库事件名是 `field:change` / `field:update`，不是 `change` 直接冒泡到 `u-form`；监听 model 写入必须用 `field:update`。
> - `reset()` 恢复的是 model 引用变更时的快照，不是清空；需要「清空」语义时自己 `Object.assign(formData, 空值对象)` 后调 `clearValidate()`。
> - `initialModel` 与 `reset()` 快照是两个来源：传不同对象时，`reset()` 后字段值与「变更前」展示值可以不同；把 `initialModel` 与 `model` 初始值保持一致即可对齐两者。
> - 独立使用控件（不在 `u-form` 内）时才用 `v-model`；不要把控件文档的「基础用法」原样搬进表单。
