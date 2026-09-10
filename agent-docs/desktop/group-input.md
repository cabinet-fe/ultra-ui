---
title: UGroupInput 分组输入
description: "分组输入组件：绑定对象数组，每行通过默认作用域插槽渲染任意控件，行尾内置删除/追加按钮实现动态增删；modelValue 为 GroupItem[]，支持 itemStyle 条目样式、readonly 平铺展示，以及 UForm 内 field 绑定数组与 rules 校验。"
aliases: [GroupInput, group-input, 组合输入, 动态增删行, 明细行输入, 动态表单项]
keywords:
  - modelValue
  - creatable
  - itemDefault
  - itemStyle
  - max
  - field
  - rules
  - span
  - update:modelValue
  - item
  - index
  - 动态增删
  - 新增条目
  - 删除条目
  - 对象数组
  - 明细行
  - 作用域插槽
---

# UGroupInput 分组输入

`@veltra/desktop` 导出分组输入组件 `UGroupInput`。`modelValue` 是对象数组（`GroupItem[]`），每个条目通过默认作用域插槽 `{ item, index }` 渲染任意控件；每行右侧内置减号（删除本行）与加号（本行后插入新行）按钮，用于动态增删条目。继承全部 FormComponentProps，可在 `UForm` 内用 `field` 绑定数组字段。

## 快速上手

独立使用走 `v-model`（对象数组）；放进 `UForm` 时外层用 `field` 绑定数组字段，**有 `field` 就不要再写 `v-model`**；插槽内的控件对 `item` 的字段用 `v-model`（不是 `field`）。独立成页需先初始化主题（`import '@veltra/styles/normalize'` + `loadTheme()`），SFC 片段场景无需重复。

```vue
<script setup lang="ts">
import { UGroupInput, UInput } from '@veltra/desktop'
import { shallowRef } from 'vue'

const users = shallowRef<{ name: string; age: string }[]>([])
</script>

<template>
  <u-group-input v-model="users">
    <template #default="{ item, index }">
      <u-input v-model="item.name" placeholder="姓名" />
      <u-input v-model="item.age" placeholder="年龄" />
      <span>第 {{ index + 1 }} 行</span>
    </template>
  </u-group-input>
  <p>{{ JSON.stringify(users) }}</p>
  <!-- => 点击「新增」并输入后：[{"name":"Alice","age":"30"}] -->
</template>
```

## API 签名

```ts
import type { StyleValue } from 'vue'

export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

/** 字段校验规则（UForm / UFormItem 的 rules）。required 对数组生效：空数组视为未填 */
export interface ValidateRule {
  /** 是否必填。true 用默认文案「该项不能为空」，字符串为自定义文案 */
  required?: boolean | string
  /** 声明于类型，当前校验实现未读取，写了无效果 */
  length?: number | [number, string]
  /** 最小值。[min, 文案]；值须为 number，默认文案「该项必须大于等于{min}」 */
  min?: number | [number, string]
  /** 最大值。[max, 文案]；值须为 number，默认文案「该项必须小于等于{max}」 */
  max?: number | [number, string]
  /** 最小长度，对 string 与数组生效。[minLen, 文案]；默认文案「该项长度必须大于等于{minLen}」 */
  minLen?: number | [number, string]
  /** 最大长度，对 string 与数组生效。[maxLen, 文案]；默认文案「该项长度必须小于等于:{maxLen}」 */
  maxLen?: number | [number, string]
  /** 正则匹配。值须为 string，默认文案「该项不匹配正则:{source}」 */
  match?: RegExp | [RegExp, string] | string
  /** 预设规则：email / phone / num / url / idCard */
  preset?: PresetRule
  /** 自定义校验，最后执行；返回非空字符串为错误文案，支持 Promise */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

/** 表单组件通用属性（本组件全部支持） */
export interface FormComponentProps extends ComponentProps {
  /** 表单项 label 上的 tooltip 提示，仅表单内生效 */
  tips?: string
  /** 所占列的大小；对象形态必须含 default 键 */
  span?:
    | number
    | 'full'
    | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字 */
  label?: string
  /** UForm 内绑定 model 字段的路径 */
  field?: string
  /** 是否禁用；未传时继承 UForm 的 disabled；禁用加/减按钮 */
  disabled?: boolean
  /** 是否只读；未传时继承 UForm 的 readonly，只读把每个条目的值平铺展示 */
  readonly?: boolean
  /** 校验规则，见 ValidateRule */
  rules?: ValidateRule
}

/** 分组输入组件属性 */
export interface GroupInputProps<GroupItem extends Record<string, any> = Record<string, any>>
  extends FormComponentProps {
  /** 条目数组。默认 [] */
  modelValue?: GroupItem[]
  /** 最大数量；类型已声明，当前实现未读取，不限制条目数 */
  max?: number
  /** 是否允许创建。默认 true；为 false 时仅隐藏空状态下的通栏「新增」按钮，行内加号仍可用 */
  creatable?: boolean
  /** 新增条目默认值；类型已声明，当前实现未读取，新增条目为空对象 */
  itemDefault?: Record<string, any>
  /** 条目样式，作用到每行容器；CSS 字符串 / 样式对象 / 计算值均可（StyleValue） */
  itemStyle?: StyleValue
}

/** 分组输入组件事件 */
export interface GroupInputEmits<GroupItem extends Record<string, any> = Record<string, any>> {
  (e: 'update:modelValue', modelValue: GroupItem[]): void
}

/** 暴露成员（源码 _GroupInputExposed 为空接口，经 DeconstructValue 解包后仍为空）；模板 ref 上无可访问成员 */
export type GroupInputExposed = Record<string, never>
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `GroupItem[]` | `[]` | 否 | 对象数组；`GroupItem` 必须是 `Record<string, any>` 的子类型 |
| `max` | `number` | — | 否 | **当前实现未读取，条目数不受限制**；需要上限时监听 `update:modelValue` 自行截断 |
| `creatable` | `boolean` | `true` | 否 | `false` 时仅隐藏空状态的通栏「新增」按钮；已有行的行内加号不受它控制，受 `disabled` 控制 |
| `itemDefault` | `Record<string, any>` | — | 否 | **当前实现未读取**；新增条目是空对象 `{}`，字段由插槽内控件的 `v-model` 写入时创建 |
| `itemStyle` | `StyleValue` | — | 否 | 作用到每行 `li` 容器；支持样式字符串、对象与响应式计算值 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 未传时继承 `UForm` 的 `size` |
| `disabled` | `boolean` | `false` | 否 | 禁用行内加/减按钮；未传时继承 `UForm` 的 `disabled` |
| `readonly` | `boolean` | `false` | 否 | 只读渲染：每行把条目对象的所有值平铺为文本；空数组显示 `-`；未传时继承 `UForm` |
| `field` | `string` | — | 否 | 仅 `UForm` 内生效；字段值为数组 |
| `label` / `rules` / `tips` / `span` | 同 FormComponentProps | — | 否 | 仅 `UForm` / `UFormItem` 内生效 |

## 方法与事件

事件：

- `update:modelValue(value: GroupItem[])` — 点击加号（插入）、减号（删除）导致条目变化时触发，参数为纯对象数组（不含内部行 id）。外部直接改写 `modelValue` 会重建内部行列表。

默认作用域插槽（`#default="{ item, index }"`）：

- `item` — 当前条目对象（内部经 shallowReactive 包装，模板内对它写字段即写回条目数据）。
- `index` — 当前条目序号，从 0 开始。

内置行为：

- 每行右侧两个圆形按钮：减号删除当前行，加号在当前行之后插入新行；`disabled` 时均禁用。
- `modelValue` 为空数组且 `creatable: true` 时，显示通栏「新增」按钮，点击插入首个条目。
- 新增条目是空对象 `{}`，字段由插槽内控件的 `v-model` 写入时创建。

暴露：`GroupInputExposed` 为空，模板 ref 上无可访问成员。

## 典型示例

### 在 UForm 中管理明细行（field + rules）

```vue
<script setup lang="ts">
import type { FormExposed } from '@veltra/desktop'
import { UButton, UForm, UGroupInput, UInput, UNumberInput } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

const formRef = shallowRef<FormExposed>()
const formData = reactive<{ items: { name: string; quantity: number }[] }>({ items: [] })

async function handleSubmit() {
  // required 校验空数组：一条都没加时报「请至少添加一个条目」
  const valid = await formRef.value?.validate()
  if (valid) console.log('提交', formData.items) // => 条目对象数组
}
</script>

<template>
  <u-form ref="formRef" :model="formData" label-width="80px" :cols="1">
    <u-group-input label="订单明细" field="items" :rules="{ required: '请至少添加一个条目' }">
      <template #default="{ item }">
        <u-input v-model="item.name" placeholder="商品名称" />
        <u-number-input v-model="item.quantity" :min="1" placeholder="数量" />
      </template>
    </u-group-input>
  </u-form>
  <u-button type="primary" @click="handleSubmit">提交</u-button>
</template>
```

### itemStyle 条目样式（字符串 / 对象 / 响应式）

```vue
<script setup lang="ts">
import { UGroupInput, UInput } from '@veltra/desktop'
import { computed, shallowRef } from 'vue'

const items = shallowRef<{ content: string }[]>([])
const tags = shallowRef<{ content: string }[]>([])

// CSS 字符串
const styleStr = 'padding: 12px; border: 1px solid var(--u-border-color); border-radius: 6px'

// 响应式对象：超过 2 条时收紧下边距
const styleObj = computed(() => ({
  display: 'flex',
  gap: '12px',
  padding: '10px',
  marginBottom: items.value.length > 2 ? '4px' : '12px'
}))
</script>

<template>
  <u-group-input v-model="items" :item-style="styleObj">
    <template #default="{ item }">
      <u-input v-model="item.content" placeholder="内容" />
    </template>
  </u-group-input>
  <u-group-input v-model="tags" :item-style="styleStr">
    <template #default="{ item }">
      <u-input v-model="item.content" placeholder="标签" />
    </template>
  </u-group-input>
</template>
```

## 注意事项

> [!WARNING]
> - `UForm` 内外层用 `field` 绑定数组字段，**禁止**再写 `v-model`；插槽内控件对 `item` 的字段用 `v-model`，不要写 `field`。
> - `max` 与 `itemDefault` 在类型中声明，但**当前实现未读取**：条目数不受 `max` 限制，新增条目不会合并 `itemDefault`（见「常见问题」的替代做法）。
> - `creatable: false` 只隐藏空状态的「新增」按钮；已有行的行内加号仍可点击（受 `disabled` 控制），不传初始数据时组件无法产生第一行。
> - `modelValue` 是对象数组且组件直接引用其中的对象（经 shallowReactive 包装）；插槽内对 `item` 字段的原地修改**不会**触发 `update:modelValue`，只有增删行才触发。需要感知字段编辑时在字段控件上监听。
> - 只读态把条目对象的全部值平铺展示（`Object.values` 顺序），不渲染插槽内容。
> - `rules.required` 对数组生效：空数组视为未填；`minLen` / `maxLen` 也适用于数组长度（条目数校验）。

## 常见问题

### 新增行想带初始值（`itemDefault` 无效）

新增条目是空对象，字段在插槽控件写入时才创建。修复：在插槽内给控件做取值兜底，或监听 `update:modelValue` 补字段。

```vue
<script setup lang="ts">
import { UGroupInput, UInput } from '@veltra/desktop'
import { shallowRef } from 'vue'

const items = shallowRef<{ name: string; quantity: number }[]>([])

// 新增行时补默认值：数量固定为 1
function handleUpdate(next: { name: string; quantity: number }[]) {
  items.value = next.map((it) => ({ quantity: 1, ...it }))
}
</script>

<template>
  <u-group-input v-model="items" @update:model-value="handleUpdate">
    <template #default="{ item }">
      <u-input v-model="item.name" placeholder="商品名称" />
    </template>
  </u-group-input>
</template>
```

### 想限制最多 N 行（`max` 无效）

修复：监听 `update:modelValue` 截断，或把超量时的加号交给 `disabled` 控制（组件行内加号无法从外部单独禁用）：

```vue
<u-group-input
  v-model="items"
  @update:model-value="items = $event.slice(0, 5)"
>
  <template #default="{ item }">
    <u-input v-model="item.name" />
  </template>
</u-group-input>
```
