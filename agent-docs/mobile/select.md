---
title: USelect 单选选择器（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端单选选择器：点击触发器弹出底部面板（BottomSheet 形态）单选一个值，支持本地/远程搜索、输入创建、清除、网格布局与 text 兜底回显。v-model 绑定选中项 valueKey 字段的值；API 与 @veltra/desktop 的 USelect 同名同默认值。'
aliases: [Select, SingleSelect, 下拉框, 移动端选择器, el-select]
keywords:
  [
    modelValue,
    options,
    valueKey,
    labelKey,
    text,
    filterable,
    creatable,
    clearable,
    update:text,
    SelectProps,
    placeholder,
    grid,
    底部面板,
    远程搜索,
    选项创建,
    兜底文案,
    冗余文案同步,
    表单选择,
    移动端选择
  ]
---

# USelect 单选选择器（@veltra/mobile 移动端）

`@veltra/mobile` 导出单选组件 `USelect`。点击触发器弹出**底部面板**单选一个值，选中即落值并收起面板；`options` 接收平铺对象数组或远程搜索函数，`v-model` 绑定选中项 `valueKey` 字段的值（不是整个选项对象）。属性名、类型与默认值与 `@veltra/desktop` 的 `USelect` 完全对齐，差异只在交互形态：移动端弹底部面板、无键盘导航、无虚拟滚动。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { USelect } from '@veltra/mobile'
import '@veltra/mobile/components/select/style'

const city = shallowRef<string>()

// 选项为对象数组，默认取 label 作为展示文案、value 作为绑定值
const cities = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' }
]
</script>

<template>
  <USelect v-model="city" :options="cities" placeholder="请选择城市" clearable filterable />
  <!-- 点击触发器弹出底部面板，选中上海并收起后：city => 'shanghai' -->
</template>
```

视觉初始化前提：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。组件按需样式引入路径为 `@veltra/mobile/components/select/style`。

## API 签名

```ts
// 以下公共类型定义来自 @veltra/utils（@veltra/mobile 未再导出，此处仅说明 prop 类型）
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

export interface ValidateRule {
  /** 是否必填。`true` 或校验失败提示文本 */
  required?: boolean | string
  /** 长度 */
  length?: number | [number, string]
  /** 最小值 */
  min?: number | [number, string]
  /** 最大值 */
  max?: number | [number, string]
  /** 最小长度 */
  minLen?: number | [number, string]
  /** 最大长度 */
  maxLen?: number | [number, string]
  /** 匹配 */
  match?: RegExp | [RegExp, string] | string
  /** 预设规则 */
  preset?: PresetRule
  /** 自定义校验：返回错误文本表示失败 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

/** 选择器属性（SelectProps 继承的 FormComponentProps 已展开） */
export interface SelectProps {
  /** 绑定值：选中项 valueKey 字段的值，清除后为 undefined */
  modelValue?: any
  /** 列表选项。传入函数时 filterable 被强制启用，且初始会以空串调用一次 */
  options?:
    Record<string, any>[] | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])
  /** 值字段名。默认 'value' */
  valueKey?: string
  /** 标签字段名。默认 'label' */
  labelKey?: string
  /** 兜底展示文案：modelValue 未命中选项时展示，命中时展示选项 label */
  text?: string
  /** 是否可清除。默认 true */
  clearable?: boolean
  /** 占位符。默认 '请选择' */
  placeholder?: string
  /** 是否启用搜索。默认 false */
  filterable?: boolean
  /** 是否允许创建新的选项。默认 false */
  creatable?: boolean
  /** 网格布局；开启后选项按 N 列网格呈现 */
  grid?: { cols: number; gap?: number }
  /** 底部面板内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 底部面板内容容器类名 */
  contentClass?: unknown
  /** 声明保留（与 desktop 对齐）；当前实现未作用于底部面板 */
  minWidth?: string
  /** 声明保留（与 desktop 对齐）；当前实现未作用于底部面板 */
  width?: string
  /** 组件尺寸。默认 'default' */
  size?: ComponentSize
  /** UForm 内的提示文字；移动端 UForm 不渲染该提示 */
  tips?: string
  /** 所占列数；移动端 UForm 单列呈现，该属性不生效 */
  span?:
    number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字，仅 UForm 内生效 */
  label?: string
  /** UForm 内绑定的 model 字段。设置后禁止再写 v-model */
  field?: string
  /** 是否禁用。默认 false */
  disabled?: boolean
  /** 是否只读（渲染为纯文本，不渲染触发器与面板）。默认 false */
  readonly?: boolean
  /** 校验规则，仅 UForm 内生效 */
  rules?: ValidateRule
}

export interface SelectEmits {
  /**
   * 选中项文案变化（用于同步父级冗余字段）。
   * 命中选项时发出 label，清空时发出 undefined；未命中选项时，
   * 传了 text 兜底则不发出（父级文案已是事实来源），未传 text 时发出 undefined；readonly 下不发出
   */
  (e: 'update:text', text?: string): void
  (e: 'update:modelValue', modelValue?: any): void
  (e: 'change', option?: Record<string, any>): void
}
```

`@veltra/mobile` 未定义 `SelectExposed`，组件源码未调用 `defineExpose`，模板 ref 上无可用成员。

## 参数说明

| 参数           | 类型                                                                                                 | 默认             | 必填 | 约束                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------- | ---------------- | :--: | ----------------------------------------------------------------------------------------------------------- |
| `modelValue`   | `any`                                                                                                | —                |  否  | 选中项 `valueKey` 字段的值；清除后为 `undefined`。回显按 `===` 与选项严格匹配，类型必须一致                 |
| `options`      | `Record<string, any>[] \| ((qs: string) => Promise<Record<string, any>[]> \| Record<string, any>[])` | —                |  是  | 数组为本地数据；传函数时 `filterable` 强制开启，初始以空串 `''` 调用一次，输入变化以 200ms 防抖调用         |
| `valueKey`     | `string`                                                                                             | `'value'`        |  否  | 选项对象取值字段名，支持 `a.b` 链式取值                                                                     |
| `labelKey`     | `string`                                                                                             | `'label'`        |  否  | 选项对象展示字段名；本地过滤仅按该字段 `includes` 匹配                                                      |
| `text`         | `string`                                                                                             | —                |  否  | 兜底展示文案：`modelValue` 未命中选项时展示（如回显数据对应选项已删除），命中时展示选项 label               |
| `clearable`    | `boolean`                                                                                            | `true`           |  否  | 有选中值且非禁用时触发器常显清除按钮（替代箭头图标），点击清除                                             |
| `placeholder`  | `string`                                                                                             | `'请选择'`       |  否  | 无选中值时的触发器文案；同时作为底部面板标题                                                                |
| `filterable`   | `boolean`                                                                                            | `false`          |  否  | 面板展开后自动聚焦搜索框即时过滤；本地过滤 200ms 防抖                                                      |
| `creatable`    | `boolean`                                                                                            | `false`          |  否  | 面板内输入串无同 `labelKey` 精确匹配项时置顶临时选项（label=value=输入串），点击选中并收起面板时转正为创建项；清除选中会清空全部创建项 |
| `grid`         | `{ cols: number; gap?: number }`                                                                     | —                |  否  | 网格布局，`cols` 必填、`gap` 单位 px；网格模式下选中项不渲染对勾图标                                       |
| `contentStyle` | `CSSProperties \| string`                                                                            | —                |  否  | 底部面板内容容器样式                                                                                        |
| `contentClass` | `unknown`                                                                                            | —                |  否  | 底部面板内容容器类名                                                                                        |
| `minWidth`     | `string`                                                                                             | —                |  否  | 声明保留；底部面板为全宽面板，当前实现不生效                                                                |
| `width`        | `string`                                                                                             | —                |  否  | 声明保留；底部面板为全宽面板，当前实现不生效                                                                |
| `size`         | `ComponentSize`                                                                                      | `'default'`      |  否  | `'small' \| 'default' \| 'large'`；UForm 上设置的值兜底，组件 prop 优先                                    |
| `tips`         | `string`                                                                                             | —                |  否  | 仅 UForm（或 UFormItem）内生效；移动端不渲染悬浮提示                                                        |
| `span`         | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }`                                           | —                |  否  | 仅 UForm 内生效；移动端单列呈现，不生效                                                                     |
| `label`        | `string`                                                                                             | —                |  否  | 仅 UForm 内生效，生成 UFormItem 标签                                                                       |
| `field`        | `string`                                                                                             | —                |  否  | UForm 按该路径读写 `model`；设置后禁止再写 `v-model`                                                        |
| `disabled`     | `boolean`                                                                                            | `false`          |  否  | 禁用交互（不弹面板、不可清除）                                                                              |
| `readonly`     | `boolean`                                                                                            | `false`          |  否  | 渲染为纯文本，不渲染触发器与面板；无选中时显示 `-`                                                          |
| `rules`        | `ValidateRule`                                                                                       | —                |  否  | 仅 UForm 内生效；枚举见 API 签名                                                                            |

## 方法与事件

- `update:modelValue` — payload 为选中项 `valueKey` 字段的值（`any`）；清除时 payload 为 `undefined`。`v-model` 即绑定此事件。
- `change` — payload `(option?: Record<string, any>)`：用户选择时为**整个选项对象**，清除时为 `undefined`。仅用户操作触发；在 `UFormItem` 内会冒泡为 Item 的 `change`。
- `update:text` — payload `(text?: string)`：选中项展示文案。触发时机与取值：用户选择 / `modelValue` 回显命中 / 异步 `options` 到达后完成回显时发出 label；清空时发出 `undefined`；未命中选项时，传了 `text` 兜底则**不发出**（父级文案即事实来源，避免冗余回写），未传 `text` 时发出 `undefined`；`readonly` 下一律不发出。可直接 `v-model:text` 绑定冗余字段。
- 面板交互：点击触发器弹出底部面板；点击选项即落值并收起面板；点击遮罩直接收起面板（不改动已选值）。
- 插槽：`prefix`（触发器前缀）；`default` 作用域插槽 `{ option, index }` 自定义选项渲染。
- ref：无暴露成员。

## 典型示例

### 面板内搜索 + 输入创建

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { USelect } from '@veltra/mobile'
import '@veltra/mobile/components/select/style'

const userId = shallowRef<number>()

// 自定义字段：valueKey / labelKey 指向选项对象上的字段名
const users = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 },
  { name: '王五', id: 3 }
]
</script>

<template>
  <!-- 面板展开后搜索框自动聚焦；输入"赵"无精确匹配时置顶临时项，点击即创建、选中并收起面板 -->
  <USelect
    v-model="userId"
    :options="users"
    value-key="id"
    label-key="name"
    filterable
    creatable
    placeholder="选择或输入创建"
  />
</template>
```

### 远程搜索

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { USelect } from '@veltra/mobile'
import '@veltra/mobile/components/select/style'

const productId = shallowRef<number>()

// options 传函数即远程搜索：filterable 自动开启，200ms 防抖
// 初始会以空串调用一次，因此空串分支必须返回数组
async function searchProducts(qs: string) {
  if (!qs) return []
  const res = await fetch(`/api/products?q=${encodeURIComponent(qs)}`)
  return (await res.json()) as { id: number; name: string }[]
}
</script>

<template>
  <USelect
    v-model="productId"
    :options="searchProducts"
    value-key="id"
    label-key="name"
    placeholder="输入关键词搜索产品"
  />
</template>
```

### 回显未命中选项时兜底展示（text）

```vue
<script setup lang="ts">
import { reactive } from 'vue'

import { USelect } from '@veltra/mobile'
import '@veltra/mobile/components/select/style'

// 编辑回显：后端存了 code 与冗余文案；当前 options 已不含 A121（如数据权限收窄）
const form = reactive({ makerCode: 'A121', makerText: '张三（已离职）' })

const makers = [
  { label: '李四', value: 'B202' },
  { label: '王五', value: 'C303' }
]
</script>

<template>
  <!-- 未命中时展示 text『张三（已离职）』而非编码 A121；重新选中后 update:text 把冗余文案同步为新 label -->
  <USelect v-model="form.makerCode" v-model:text="form.makerText" :options="makers" clearable />
</template>
```

### UForm 内 field 绑定 + 校验 + 同步冗余文案

```vue
<script setup lang="ts">
import { reactive, useTemplateRef } from 'vue'

import { UButton, UForm, USelect } from '@veltra/mobile'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/select/style'
import '@veltra/mobile/components/button/style'

// UForm 按 field 路径读写 model；控件上禁止再写 v-model
const form = reactive({ grade: undefined as number | undefined, gradeText: '' })

const formRef = useTemplateRef<{ validate: (keys?: string[]) => Promise<boolean> }>('formRef')

const gradeList = [
  { label: '一年级', value: 1 },
  { label: '二年级', value: 2 },
  { label: '三年级', value: 3 }
]

async function submit() {
  // validate 为异步，全部通过返回 true；失败时表单滚动到第一条错误
  const ok = await formRef.value?.validate()
  if (ok) console.log(form.grade) // => 选中的 value，如 2
}
</script>

<template>
  <UForm ref="formRef" :model="form">
    <USelect
      label="年级"
      field="grade"
      :options="gradeList"
      :rules="{ required: '请选择年级' }"
      @update:text="form.gradeText = $event ?? ''"
    />
    <UButton type="primary" @click="submit">提交</UButton>
  </UForm>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是点击触发器弹出**底部面板**（BottomSheet 形态，遮罩点击收起、面板展开期间锁定页面滚动），桌面端是下拉面板。
> - 移动端清除按钮在有值且 `clearable` 时**常显**（无 hover 概念），桌面端悬停触发器时才显示。
> - 移动端**无键盘导航**（`ArrowDown` / `ArrowUp` / `Enter` 选中是桌面端行为），选择只能点击选项。
> - 移动端选项列表**直接渲染、无虚拟滚动**；桌面端选项超过 80 条自动虚拟滚动。
> - 移动端空态与加载态为面板内文本「暂无数据」「加载中...」；桌面端空态渲染 `UEmpty` 组件。
> - `width` / `minWidth` 属性声明保留（与 desktop 对齐），当前实现中底部面板为全宽面板，二者不生效。
> - 在 UForm 中必须用 `field` 绑定，禁止再写 `v-model`；`label` / `rules` / `span` / `tips` 仅在 UForm（或 UFormItem）内生效，且移动端 `span` 与 `tips` 不产生布局与提示效果。
> - `v-model` 绑定的是选中项 `valueKey` 字段的值（标量），不是整个选项对象；需要对象时监听 `@change`。
> - 展示文案由 `options` 推导，未命中选项时展示 `text` 兜底文案；同步冗余文案用 `v-model:text`（或 `@update:text`）。未命中且传了 `text` 时组件不发送该事件，未传 `text` 时发出 `undefined`；`readonly` 下一律不发送。
> - `options` 传函数时 `filterable` 被强制开启，且初始以空串 `''` 调用一次，函数必须能处理空串。
> - 远程搜索请求期间面板内显示「加载中...」；组件内置竞态序号守卫，慢的旧响应不会覆盖新查询的结果。
> - 本地搜索只匹配 `labelKey` 字段的 `includes`，不匹配 `valueKey` 与其他字段。
> - 清除选中会同时清空 `creatable` 产生的历史创建项。

## 常见问题

### 回显显示原始值而不是 label

两种原因：

1. `modelValue` 与选项 `valueKey` 字段的值类型不一致，回显按 `===` 严格匹配，`'1'` 匹配不到 `1`。修复：保证类型一致。
2. 选项已被删除（如数据权限收窄后回显旧单据），`modelValue` 不在 `options` 中。修复：传 `text` 兜底文案。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { USelect } from '@veltra/mobile'
import '@veltra/mobile/components/select/style'

// 原因 1：选项为 { label: '一年级', value: 1 } 时，初值必须是 number
const grade = shallowRef<number>(1) // 正确
// const grade = shallowRef<string>('1') // 错误：显示 '1' 而不是 '一年级'

// 原因 2：选项已不存在，传入冗余文案兜底（模板上 :text="form.text"）
const form = { code: 'A121', text: '张三（已离职）' }
</script>

<template>
  <USelect v-model="grade" :options="[{ label: '一年级', value: 1 }]" />
</template>
```

### 在 UForm 中同时写了 `field` 和 `v-model`

状态由 `field` 接管后 `v-model` 是重复绑定，两者会竞争写入。修复：删除 `v-model`，只保留 `field`。
