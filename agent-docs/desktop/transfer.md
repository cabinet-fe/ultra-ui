---
title: UTransfer 穿梭框
description: '双栏穿梭框组件：源栏与目标栏列表勾选后左右互移，`v-model` 绑定目标侧 key 集合。支持按 label 搜索过滤、选项禁用、两栏全选与已选计数，移动后自动清空勾选。'
aliases: [Transfer, 穿梭框, 双栏选择, 穿梭列表, 双栏穿梭]
keywords:
  [
    modelValue,
    dataSource,
    titles,
    filterable,
    filterPlaceholder,
    TransferOption,
    TransferDirection,
    TransferProps,
    勾选,
    互移,
    搜索过滤,
    禁用项,
    全选,
    双栏列表,
    目标列表
  ]
---

# UTransfer 穿梭框

`@veltra/desktop` 导出双栏穿梭框组件 `UTransfer`（模板标签 `<u-transfer>`）。`dataSource` 提供全部选项，`v-model` 绑定目标侧选项 `key` 的数组；在任一栏勾选若干项后点中间按钮移到另一栏，移动完成后两栏勾选自动清空。分工规则：平铺数据多选用 `UMultiSelect`（单栏下拉 + 标签回显）；数据需要「左边未选、右边已选」两栏对照、且两边都可能再勾选批量互移时用 `UTransfer`；树形层级数据用 `UTreeSelect`。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UTransfer } from '@veltra/desktop'

// 绑定值是数组，元素为选项 key 字段的值；初始即在目标栏的项
const targetKeys = shallowRef<(string | number)[]>([2, 5])

const dataSource = Array.from({ length: 8 }).map((_, i) => ({ key: i + 1, label: `选项${i + 1}` }))
</script>

<template>
  <u-transfer v-model="targetKeys" :data-source="dataSource" />
  <!-- 勾选 1、3 后点右移按钮：targetKeys => [2, 5, 1, 3] -->
</template>
```

## API 签名

```ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 穿梭框选项 */
export interface TransferOption {
  /** 选项唯一标识 */
  key: string | number
  /** 选项展示文案 */
  label: string
  /** 是否禁用该选项：禁用项不可勾选、不可移动 */
  disabled?: boolean
}

/** 移动方向：right 为源栏 → 目标栏，left 为目标栏 → 源栏 */
export type TransferDirection = 'left' | 'right'

/** 穿梭框属性（FormComponentProps 已展开） */
export interface TransferProps extends FormComponentProps {
  /** 绑定值：目标侧选项 key 集合 */
  modelValue?: Array<string | number>
  /** 数据源，两栏共用；按出现顺序渲染。默认 [] */
  dataSource?: TransferOption[]
  /** 栏标题：[源栏, 目标栏]。默认 ['源列表', '目标列表'] */
  titles?: [string, string]
  /** 是否可搜索：两栏各自按 label 过滤。默认 false */
  filterable?: boolean
  /** 搜索框占位符：[源栏, 目标栏]。默认 ['请输入搜索内容', '请输入搜索内容'] */
  filterPlaceholder?: [string, string]
  /** 组件尺寸。默认 'default' */
  size?: ComponentSize
  /** 是否禁用。默认 false */
  disabled?: boolean
  /** 是否只读（行为等同禁用）。默认 false */
  readonly?: boolean
  /** UForm 内的提示文字，仅 UForm 内生效 */
  tips?: string
  /** 所占列数，仅 UForm 内生效 */
  span?:
    number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字，仅 UForm 内生效 */
  label?: string
  /** UForm 内绑定的 model 字段。设置后禁止再写 v-model */
  field?: string
  /** 校验规则，仅 UForm 内生效 */
  rules?: ValidateRule
}

export interface TransferEmits {
  (e: 'update:modelValue', keys: Array<string | number>): void
  (
    e: 'change',
    targetKeys: Array<string | number>,
    direction: TransferDirection,
    movedKeys: Array<string | number>
  ): void
}

/** ref 暴露类型（DeconstructValue 解包后的形态）：无暴露成员 */
export type TransferExposed = Record<string, never>
```

## 参数说明

| 参数                | 类型                      | 默认                                   | 必填 | 约束                                                                            |
| ------------------- | ------------------------- | -------------------------------------- | :--: | ------------------------------------------------------------------------------- |
| `modelValue`        | `Array<string \| number>` | —                                      |  否  | 元素为选项 `key` 字段的值；回显按 `===` 严格匹配，元素类型必须与 `key` 一致     |
| `dataSource`        | `TransferOption[]`        | `[]`                                   |  否  | 两栏共用；`key` 必须唯一；两栏均按 `dataSource` 出现顺序渲染                    |
| `titles`            | `[string, string]`        | `['源列表', '目标列表']`               |  否  | 下标 0 为源栏标题、1 为目标栏标题                                               |
| `filterable`        | `boolean`                 | `false`                                |  否  | 开启后两栏头部各自显示搜索框，按本栏选项 `label` 做 `includes` 匹配，大小写敏感 |
| `filterPlaceholder` | `[string, string]`        | `['请输入搜索内容', '请输入搜索内容']` |  否  | 两栏搜索框占位符，下标含义同 `titles`                                           |
| `size`              | `ComponentSize`           | `'default'`                            |  否  | `'small' \| 'default' \| 'large'`；UForm 上设置的值兜底，组件 prop 优先         |
| `disabled`          | `boolean`                 | `false`                                |  否  | 禁用整组交互：勾选、搜索框、移动按钮全部禁用                                    |
| `readonly`          | `boolean`                 | `false`                                |  否  | 行为等同 `disabled`，用于表单只读态                                             |
| `field`             | `string`                  | —                                      |  否  | UForm 按该路径读写 `model`；设置后禁止再写 `v-model`                            |
| `rules`             | `ValidateRule`            | —                                      |  否  | 仅 UForm 内生效；枚举见 API 签名                                                |

## 方法与事件

- `update:modelValue` — payload 为移动后的目标侧 key 数组（`Array<string | number>`），移动左侧到右侧按勾选顺序追加。`v-model` 即绑定此事件。
- `change` — payload `(targetKeys, direction, movedKeys)`：
  - `targetKeys: Array<string | number>`：移动后的目标侧 key 数组；
  - `direction: TransferDirection`：`'right'` 表示源栏 → 目标栏，`'left'` 表示目标栏 → 源栏；
  - `movedKeys: Array<string | number>`：本次被移动的 key 数组。
  - 仅点击移动按钮时触发（含用户操作语义）；勾选、取消勾选不触发。
- 每栏头部有全选复选框（支持半选态）与 `已勾选数/本栏总数` 计数；全选作用于当前搜索结果中未禁用的选项。
- 移动完成后两栏勾选全部清空；中间移动按钮在对应方向无可移动勾选项时禁用。

## 典型示例

### 搜索过滤

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UTransfer } from '@veltra/desktop'

const targetKeys = shallowRef<(string | number)[]>([])

const members = [
  { key: 'zhangsan', label: '张三' },
  { key: 'lisi', label: '李四' },
  { key: 'wangwu', label: '王五' },
  { key: 'zhaoliu', label: '赵六' }
]
</script>

<template>
  <!-- 两栏各自搜索：源栏输入"张"只过滤源栏，目标栏不受影响 -->
  <u-transfer
    v-model="targetKeys"
    :data-source="members"
    :titles="['未分配', '已分配']"
    filterable
    :filter-placeholder="['搜索未分配成员', '搜索已分配成员']"
  />
</template>
```

### 禁用项 + 监听 change

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UTransfer } from '@veltra/desktop'

// 禁用项不可勾选；已在目标栏的禁用项无法移回源栏
const permissions = [
  { key: 'read', label: '可读', disabled: true },
  { key: 'write', label: '可写' },
  { key: 'remove', label: '可删除', disabled: true },
  { key: 'share', label: '可分享' }
]

const granted = shallowRef<(string | number)[]>(['read'])

// targetKeys 为移动后目标侧 key 数组；movedKeys 为本次移动的 key
function onChange(
  targetKeys: Array<string | number>,
  direction: 'left' | 'right',
  movedKeys: Array<string | number>
) {
  console.log(direction, movedKeys, targetKeys) // => 'right' ['share'] ['read', 'share']
}
</script>

<template>
  <u-transfer
    v-model="granted"
    :data-source="permissions"
    :titles="['可授权', '已授权']"
    @change="onChange"
  />
</template>
```

### UForm 内 field 绑定 + 必填校验

```vue
<script setup lang="ts">
import { reactive, useTemplateRef } from 'vue'

import { UButton, UForm, UTransfer } from '@veltra/desktop'

// UForm 按 field 路径读写 model；控件上禁止再写 v-model
const form = reactive({ roles: [] as Array<string | number> })

const formRef = useTemplateRef<{ validate: (keys?: string[]) => Promise<boolean> }>('formRef')

const roles = [
  { key: 'admin', label: '管理员' },
  { key: 'dev', label: '开发' },
  { key: 'ops', label: '运维' }
]

async function submit() {
  const ok = await formRef.value?.validate()
  if (ok) console.log(form.roles) // => ['admin', 'dev']
}
</script>

<template>
  <u-form ref="formRef" :model="form">
    <u-transfer
      label="角色"
      field="roles"
      :data-source="roles"
      :rules="{ required: '至少分配一个角色' }"
      :span="12"
    />
    <u-button @click="submit">提交</u-button>
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
>
> - 本库数据源属性是 `dataSource`，选项字段固定为 `key` / `label` / `disabled`，不是 AntD 的 `dataSource + rowKey + render`；不支持 `children` 自定义渲染、`oneWay` 单向模式、`operations` 按钮文案、`footer` 底部插槽。
> - 本库搜索开关是 `filterable`，不是 AntD 的 `showSearch`；搜索只按 `label` 做 `includes` 匹配，大小写敏感，不提供自定义过滤函数。
> - 两栏渲染顺序均跟随 `dataSource` 出现顺序：`modelValue` 数组顺序不影响目标栏排序。
> - `dataSource` 或 `modelValue` 外部变化后，已不在 `dataSource` 里的残留勾选会被自动清掉；`modelValue` 里不在 `dataSource` 的 key 不参与渲染，移动其它项时原样保留在数组中。
> - 勾选状态不写入 `modelValue`：只有点移动按钮才更新绑定值并触发 `change`。
> - 在 UForm 中必须用 `field` 绑定，禁止再写 `v-model`；`label` / `rules` / `span` / `tips` 仅在 UForm（或 UFormItem）内生效。
> - `readonly` 行为等同 `disabled`：本组件没有独立的只读展示形态。

## 常见问题

### 移动后勾选自动清空，想保留勾选

移动完成后清空两栏勾选是预期行为（与 AntD 一致）。需要连续移动时重新勾选即可；禁止依赖「移动后勾选仍在」写自动化断言。

### 目标栏顺序与 modelValue 数组顺序不一致

本库目标栏按 `dataSource` 出现顺序渲染，不按 `modelValue` 数组顺序。需要自定义顺序时按目标 key 重排 `dataSource`：

```ts
// 把已选项排到 dataSource 前面，目标栏即按此顺序展示
const ordered = [
  ...dataSource.filter((o) => targetKeys.includes(o.key)),
  ...dataSource.filter((o) => !targetKeys.includes(o.key))
]
```

### 勾选了项但移动按钮仍是禁用

原因：按钮按「本方向是否有可移动勾选项」禁用——右移按钮只看源栏勾选、左移按钮只看目标栏勾选；整栏勾选为空或整组 `disabled` / `readonly` 时按钮禁用。修复：确认勾选落在需要移动的那一栏，且未设置 `disabled`。
