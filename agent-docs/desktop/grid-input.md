---
title: UGridInput 网格输入框
description: "分格数字输入框：按格子逐位输入数字并自动前进光标，modelValue 为按分隔符拼接的字符串；支持格子数量、分隔符、是否允许 0（验证码 / 组织编码），暴露 clear() 清空。"
aliases: [GridInput, grid-input, 验证码输入框, 分格输入框, OTPInput, 逐格输入]
keywords:
  - modelValue
  - length
  - zero
  - separator
  - clear
  - GridInputExposed
  - input
  - update:modelValue
  - 验证码
  - 短信验证码
  - 逐格输入
  - 组织编码
  - 数据回显
  - 退格删除
  - 方向键
---

# UGridInput 网格输入框

`@veltra/desktop` 导出网格输入框组件 `UGridInput`。把输入拆成 `length` 个格子，每位只能键入一个数字，键入后光标自动前进；`modelValue` 是各格内容按 `separator` 拼接的字符串。典型场景：短信/图形验证码（`zero: true` 允许 0）、组织编码结构（默认禁止 0，每位 1-9）。

## 快速上手

用 `v-model` 绑定字符串；放进 `UForm` 时用 `field` 绑定 model 字段，**有 `field` 就不要再写 `v-model`**。独立成页需先初始化主题（`import '@veltra/styles/normalize'` + `loadTheme()`），SFC 片段场景无需重复。

```vue
<script setup lang="ts">
import { UGridInput } from '@veltra/desktop'
import { shallowRef } from 'vue'

const code = shallowRef('')
</script>

<template>
  <!-- 默认 6 格、分隔符 '-'、每位仅 1-9；输入 123 后 code 为 '1-2-3' -->
  <u-grid-input v-model="code" />
  <p>当前值：{{ code || '（空）' }}</p>
</template>
```

## API 签名

```ts
/** 网格输入框组件属性 */
export interface GridInputProps {
  /** 输入值；各格内容按 separator 拼接的字符串。默认 undefined（等价空字符串） */
  modelValue?: string
  /** 格子数量。默认 6；正整数 */
  length?: number
  /**
   * 是否允许输入 0。默认 false
   * false 时每位仅接受 1-9；true 时接受 0-9（验证码场景）
   */
  zero?: boolean
  /** 格子之间的分隔符，参与 modelValue 拼接与解析。默认 '-'；空字符串表示无分隔符 */
  separator?: string
}

/** 网格输入框组件事件 */
export interface GridInputEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'input', value: string): void
}

/** 模板 ref 上可直接访问的成员（源码经 DeconstructValue 解包 _GridInputExposed） */
export interface GridInputExposed {
  /** 清空全部格子并重置光标；同步，不抛错 */
  clear: () => void
}
```

`GridInputProps` **不继承** `FormComponentProps`，没有 `size` / `disabled` / `readonly` 属性；`label` / `rules` / `tips` / `span` / `field` 在 `UForm` 内由 `UForm` 从子控件属性中提取并生成 `UFormItem`（运行时生效，与类型声明无关）。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `string` | — | 否 | 各格字符按 `separator` 拼接；`separator` 为空字符串时为纯数字串（如 `'102030'`） |
| `length` | `number` | `6` | 否 | 格子数量，正整数；超出 `length` 的输入不再写入 |
| `zero` | `boolean` | `false` | 否 | `false`：每位仅 1-9，键入 0 被忽略（无提示）；`true`：0-9 均可 |
| `separator` | `string` | `'-'` | 否 | 格子分隔符；`''` 无分隔符；常用取值 `'-'`、`' '`（空格）、`''` |

## 方法与事件

事件：

- `update:modelValue(value: string)` — 每次格子写入或删除后触发，参数为拼接后的字符串。
- `input(value: string)` — 与 `update:modelValue` 同时触发，参数相同；适合「输满自动提交」监听。

暴露（`GridInputExposed`，模板 ref 上直接调用）：

- `clear(): void` — **同步**。清空全部格子并重置光标；**不触发** `update:modelValue`，也不会改写 `v-model` 变量，调用后必须自行把绑定的变量置空。

键盘与焦点：

- 每个格子 `tabindex="0"`，点击或 Tab 聚焦；数字键写入当前格并自动前进到下一格。
- `Backspace`：当前格有值则删除当前格，否则删除前一格，光标左移。
- `ArrowLeft` / `ArrowRight`：在已有内容范围内移动光标。
- 回显：`modelValue` 变化时按 `separator` 拆分回填格子（过滤空段，最多取前 `length` 格）。

## 典型示例

### 短信验证码（允许 0，输满自动提交）

```vue
<script setup lang="ts">
import { UGridInput } from '@veltra/desktop'
import { shallowRef } from 'vue'

const smsCode = shallowRef('')

// 输满 6 位自动提交
function onInput(value: string) {
  if (value.length === 6) {
    console.log('自动提交验证码', value) // => '012345'
  }
}
</script>

<template>
  <!-- zero 允许输入 0；无分隔符，modelValue 为纯数字串 -->
  <u-grid-input v-model="smsCode" :length="6" :zero="true" separator="" @input="onInput" />
</template>
```

### 组织编码结构（禁止 0，带分隔符回显）

```vue
<script setup lang="ts">
import { UGridInput } from '@veltra/desktop'
import { shallowRef } from 'vue'

// 每层一个变量；初始值须与 separator 拼装格式一致，'1-2-3' 拆成 3 格回显
const level1 = shallowRef('1-2-3') // 一级编码，3 位
const level2 = shallowRef('') // 二级编码，6 位
const level3 = shallowRef('') // 三级编码，8 位
</script>

<template>
  <!-- 3-3-2 组织编码：编码长度可为 3 / 6 / 8 位，每位只能 1-9 -->
  <u-grid-input v-model="level1" :length="3" separator="-" />
  <u-grid-input v-model="level2" :length="6" separator="-" />
  <u-grid-input v-model="level3" :length="8" separator="-" />
  <p>一级编码：{{ level1 || '（空）' }}</p>
</template>
```

### ref 调用 clear() 清空

```vue
<script setup lang="ts">
import type { GridInputExposed } from '@veltra/desktop'
import { UButton, UGridInput } from '@veltra/desktop'
import { shallowRef, useTemplateRef } from 'vue'

const otp = shallowRef('')
const inputRef = useTemplateRef<GridInputExposed>('input')

function handleClear() {
  inputRef.value?.clear() // 只清内部格子，不触发 update:modelValue
  otp.value = '' // 必须自行同步 v-model 变量
}
</script>

<template>
  <u-button @click="handleClear">清空验证码</u-button>
  <u-grid-input ref="input" v-model="otp" :length="6" :zero="true" separator="" />
</template>
```

## 注意事项

> [!WARNING]
> - 本库 `modelValue` 是**字符串**（格子内容按 `separator` 拼接），不是数组；解析与拼装都依赖 `separator`。
> - `zero: false` 时键入 0 是**静默忽略**（字符不进入格子），不是校验报错。
> - `clear()` 不触发 `update:modelValue`；调用后必须自行把 `v-model` 变量置空，否则绑定值与界面不一致。
> - `GridInputProps` 不继承 `FormComponentProps`：`disabled` / `readonly` / `size` 不可用；`label` / `rules` / `span` / `tips` 仅在 `UForm` 内经 `UForm` 提取生效。
> - `UForm` 内用 `field` 绑定 model，**禁止**再写 `v-model`；独立使用走 `v-model`。
> - 初始值 / 回显格式必须与 `separator` 一致：`separator="-"` 用 `'1-2-3-4-5-6'`，`separator=""` 用 `'102030'`，否则拆分错位。
> - `separator` 变更会触发重新解析 `modelValue`；不要在格子可输入内容与分隔符字符之间产生歧义（本组件只接受数字，`'-'` 与空格做分隔符是安全的）。

## 常见问题

### 传入初始值后格子没回显或错位

原因：`modelValue` 的格式与 `separator` 不一致。修复：带分隔符时值必须含分隔符，无分隔符时必须是纯数字串。

```vue
<!-- 错误：separator 为 '-'，值没有分隔符，只会拆出 1 格 '123456' -->
<u-grid-input v-model="code" separator="-" />
<!-- 正确 -->
<u-grid-input v-model="code" separator="-" />  <!-- code = '1-2-3-4-5-6' -->
<u-grid-input v-model="code" separator="" />   <!-- code = '123456' -->
```

### 调用 clear() 后绑定变量还有旧值

`clear()` 只清组件内部格子。修复：调用后同步置空变量（见「典型示例」第三例）。
