---
title: UTableEditor 表格编辑器
description: "@veltra/desktop 的表格型编辑器组件：基于 UTable 封装，v-model 绑定行对象数组，内置序号列与「删除/新增/复制」操作列，配合 #column:{key} 插槽的 model 作用域实现单元格行内编辑；列级 rules 懒校验，错误仅在表头标红并以气泡列明细；readonly 只读模式下输入控件只读、操作列与空态「添加」按钮不渲染。"
aliases: [EditableTable, 可编辑表格, 行内编辑表格, 表格编辑]
keywords:
  [
    modelValue,
    v-model,
    UTable,
    TableColumn,
    defineTableColumns,
    __operation,
    操作列,
    行内编辑,
    行新增,
    行删除,
    行复制,
    可编辑表格,
    单元格编辑,
    rules,
    validate,
    懒校验,
    列校验,
    readonly,
    只读,
    只读展示
  ]
---

# UTableEditor 表格编辑器

`@veltra/desktop` 导出表格型编辑器组件 `UTableEditor`。它在内部渲染一个 `UTable`，用 `v-model`（`modelValue`）绑定行对象数组，自动附加序号列和带「删除 / 新增 / 复制」按钮的操作列；单元格编辑通过 `#column:{key}` 插槽把输入控件绑定到插槽作用域的 `model` 上，声明了编辑插槽的列输入控件常驻挂载，未声明的列渲染字段原始值。列配置 `rules` 后支持懒校验：控件 `change` 事件触发单元格校验，模板 ref 的 `validate()` 整表自上而下逐行校验；错误只在表头列级标红并以气泡列出行号明细，单元格内不显示任何错误样式。需要用户增删复制行、就地编辑单元格数据时用 `UTableEditor`；要复用同一套列与 `#column:{key}` 插槽做只读展示时设 `readonly`（输入控件只读、操作列与空态「添加」按钮不渲染）；不需要编辑形态时直接用 `UTable`（见 `agent-docs/desktop/table.md`）。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UNumberInput, UTableEditor, UTextarea, defineTableColumns } from '@veltra/desktop'

const columns = defineTableColumns([
  { key: 'name', name: '姓名', minWidth: 150 },
  { key: 'age', name: '年龄', width: 120, align: 'center' }
])

const list = ref<any[]>([
  { name: '张三', age: 28 },
  { name: '李四', age: 32 }
])
</script>

<template>
  <u-table-editor v-model="list" :columns="columns" border>
    <!-- model 是控件 props 包（modelValue + 写回钩子），v-bind 整体传入，输入即写回当前行 -->
    <template #column:name="{ model }">
      <u-textarea v-bind="model" />
    </template>
    <template #column:age="{ model }">
      <u-number-input v-bind="model" />
    </template>
  </u-table-editor>
</template>
```

独立页面使用时必须先初始化主题：入口文件 `import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用一次 `loadTheme()`。

## API 签名

```ts
import type { TableColumn, TableProps } from '@veltra/desktop'

/** 字段校验规则，与 UFormItem 的 rules 同一类型（@veltra/utils 导出） */
export interface ValidateRule {
  /** 是否必填；false 跳过，true 用默认文案，字符串作为自定义文案 */
  required?: boolean | string
  /** 类型遗留字段，当前校验实现不处理，配置无效果 */
  length?: number | [number, string]
  /** 最小值（数值比较）；[值, 文案] 自定义错误文案 */
  min?: number | [number, string]
  /** 最大值（数值比较）；[值, 文案] 自定义错误文案 */
  max?: number | [number, string]
  /** 最小长度（字符串 / 数组）；[值, 文案] 自定义错误文案 */
  minLen?: number | [number, string]
  /** 最大长度（字符串 / 数组）；[值, 文案] 自定义错误文案 */
  maxLen?: number | [number, string]
  /** 正则或字符串匹配；[正则, 文案] 自定义错误文案 */
  match?: RegExp | [RegExp, string] | string
  /** 预设格式校验 */
  preset?: 'email' | 'phone' | 'num' | 'url' | 'idCard'
  /** 自定义校验；value 为当前单元格值，data 为整行行对象；resolve 非空字符串即未通过 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

/** 表格编辑器列：在 TableColumn 基础上扩展按列校验 */
export interface TableEditorColumn extends TableColumn {
  /** 列校验规则；配置后该列控件的 change 事件触发单元格校验，required 非空时表头列名前渲染红星 */
  rules?: ValidateRule
}

/** 表格型编辑器组件属性：继承 UTable 的全部属性，把 data 换成 modelValue，columns 换成 TableEditorColumn[]，并新增 readonly */
export interface TableEditorProps extends Omit<TableProps, 'data' | 'columns'> {
  /** 行对象数组，配合 v-model 使用 */
  modelValue?: Record<string, any>[]
  /** 表格列 */
  columns?: TableEditorColumn[]
  /**
   * 只读模式
   * @default false
   * @description 输入控件经插槽 model 收到 readonly: true（值不可修改），操作列与空态「添加」按钮不渲染
   */
  readonly?: boolean
}

/** 表格型编辑器组件事件 */
export interface TableEditorEmits {
  (e: 'update:modelValue', value: Record<string, any>[]): void
}

/** 模板 ref 上可访问的属性与方法（DeconstructValue 解包后的形态） */
export interface TableEditorExposed {
  /** 校验全表配置了 rules 的列，全部通过 resolve true，任一失败 resolve false */
  validate(): Promise<boolean>
}
```

`ValidateRule` 的执行顺序与默认错误文案（`required` 默认「该项不能为空」、`preset` 各档默认文案等）与 `UFormItem` 完全一致，见 `agent-docs/desktop/form-item.md`。空值（`null`、`undefined`、`''`、空数组）跳过 `min` / `max` / `minLen` / `maxLen` / `match` / `preset` 校验。

`TableProps` 未在本篇展开的部分（`columns`、`rowKey`、`checkable`、`tree`、`expandable` 等）与 `TableColumn` 列定义见 `agent-docs/desktop/table.md` 的「API 签名」。

组件内部对少数 `TableProps` 有固定覆盖，传入也不生效：

- `stripe` 固定为 `false`（编辑表格不加斑马纹）。
- `showIndex` 固定为 `true`（始终渲染序号列，key 为 `__index__`，宽 60，固定左侧）。
- 非只读（`readonly` 缺省为 `false`）时列定义末尾始终追加操作列，key 固定为 `__operation`，宽 104，固定右侧，不可调整列宽；`readonly: true` 时不追加，DOM 中无操作列表头与按钮。

操作列行为（按钮为小号文本按钮，仅非只读时渲染）：

| 按钮 | 图标                 | 行为                                                         |
| ---- | -------------------- | ------------------------------------------------------------ |
| 删除 | `Minus`（danger 色） | 从数组移除当前行                                             |
| 新增 | `Plus`               | 在当前行之后插入空对象 `{}`                                  |
| 复制 | `Copy`               | `JSON.parse(JSON.stringify(rowData))` 深拷贝当前行，插入其后 |

列校验（`rules`）的触发与呈现：

- 单元格级：配置了 `rules` 的列，控件的 `change` 事件（如输入失焦提交）触发该单元格校验，输入过程不校验（懒校验）。
- 整表级：模板 ref 调用 `validate()`，自上而下逐行校验全部配置了 `rules` 的列，某行存在未通过项即停止校验其后的行。
- 错误只呈现在表头：`rules.required` 非空（`true` 或文案字符串）时表头列名前渲染红星 `*`；某列存在未通过项时该列表头文字标红并追加感叹号图标，悬停气泡按行展示「第 N 行：<错误文案>」明细。单元格内没有任何错误样式。
- 行删除或数组整体替换后，已不存在行上的错误自动清理；错误出现 / 消失即时更新表头。

## 参数说明

| 参数                           | 类型                                         | 默认         | 必填 | 约束                                                                                                       |
| ------------------------------ | -------------------------------------------- | ------------ | :--: | ---------------------------------------------------------------------------------------------------------- |
| `modelValue`                   | `Record<string, any>[]`                      | `[]`         |  否  | 行对象数组；`v-model` 绑定。增删复制行与单元格编辑值变化均以浅拷贝新数组触发 `update:modelValue`（行对象保持原引用，见「方法与事件」） |
| `columns`                      | `TableEditorColumn[]`                        | —            |  是  | 列可配 `rules` 开启按列校验；禁止使用 `key: '__operation'`，该 key 被内置操作列占用                         |
| `readonly`                     | `boolean`                                    | `false`      |  否  | 只读模式：输入控件经插槽 model 收到 readonly: true（值不可修改），操作列与空态「添加」按钮不渲染          |
| `rowKey`                       | `string`                                     | —            |  否  | 使用 `checkable` / `v-model:checked` 等受控选中时必须设置                                                  |
| `checkable`                    | `boolean`                                    | `false`      |  否  | 开启多选列，勾选状态由 `v-model:checked` 同步                                                              |
| `selectable`                   | `boolean`                                    | `false`      |  否  | 单选；与 `checkable` 同时设置时仅本项生效                                                                  |
| `checked`                      | `Record<string, any>[]`                      | —            |  否  | 多选受控值，需要 `rowKey`                                                                                  |
| `selected`                     | `Record<string, any>`                        | —            |  否  | 单选受控值，需要 `rowKey`                                                                                  |
| `tree`                         | `boolean \| string`                          | `false`      |  否  | 树形编辑；传字符串时该字符串为子节点字段名，默认 `'children'`                                              |
| `expandable`                   | `boolean`                                    | `false`      |  否  | 展开行，仅非树形有效；内容写入 `#row:expand` 插槽                                                          |
| `defaultExpandAll`             | `boolean`                                    | `false`      |  否  | 树形模式默认展开全部                                                                                       |
| `border`                       | `boolean`                                    | `false`      |  否  | —                                                                                                          |
| `size`                         | `'small' \| 'default' \| 'large'`            | `'default'`  |  否  | —                                                                                                          |
| `stripe`                       | `boolean`                                    | 固定 `false` |  否  | 内部覆盖，传入不生效                                                                                       |
| `showIndex`                    | `boolean`                                    | 固定 `true`  |  否  | 内部覆盖，传入不生效                                                                                       |
| `virtualThreshold`             | `number`                                     | `80`         |  否  | 行数超过该值开启虚拟滚动；设 `0` 始终开启                                                                  |
| `mergeCell`                    | `(ctx) => { rowspan, colspan } \| undefined` | —            |  否  | 语义同 `UTable`；操作列同样参与合并判定                                                                    |
| `slots`                        | `Readonly<Slots>`                            | —            |  否  | 函数式组件包裹时传 `$slots`                                                                                |
| `textEllipsis`                 | `boolean`                                    | `false`      |  否  | —                                                                                                          |
| `highlightCurrent` / `current` | `boolean` / `TableRow`                       | `false` / —  |  否  | 语义同 `UTable`                                                                                            |

插槽与 `UTable` 完全一致，最常用的是 `#column:{key}`：作用域为 `{ row, rowData, column, val, model }`。`model` 是控件 props 包，含 `modelValue` 与写回钩子，控件用 `v-bind="model"` 整体接收（不要用 `v-model="model.modelValue"`，那样绕过写回钩子，输入不会写回行数据）；配置了 `rules` 的列还会附带 `onChange` 触发单元格校验；`readonly: true` 时 `model` 携带 `readonly: true` 且不提供写回通道。未声明 `#column:{key}` 插槽的列渲染字段原始值；列自带 `render` 时 `render` 优先、插槽不生效。`#header:{key}` 自定义表头内容时，红星渲染在自定义内容之前，错误标红与感叹号气泡追加在其后。另有 `#row:expand`、`#foot`、`#body`、`#append`；`#empty` 被内置空态占据（非只读时含「添加」按钮，`readonly` 下不渲染），需要自定义空态改用 `UTable`。

## 方法与事件

- `update:modelValue`（`(value: Record<string, any>[]) => void`）：非只读时删除、新增、复制、空态「添加」与单元格编辑值变化触发（`readonly: true` 下这些入口均不渲染，事件不会触发）。payload 是浅拷贝的新数组：数组是新引用，行对象保持原引用。单元格编辑先原地写回行对象（行节点与 DOM 复用，输入不丢焦点）再触发事件。
- `validate(): Promise<boolean>`（模板 ref 方法，异步、不抛错）：自上而下逐行校验全部配置了 `rules` 的列，某行存在未通过项即停止校验其后的行（懒校验）。全部通过 resolve `true`，任一失败 resolve `false`。错误呈现见「API 签名」节的列校验规则。

```ts
import { useTemplateRef } from 'vue'
import type { TableEditorExposed } from '@veltra/desktop'

const editor = useTemplateRef<TableEditorExposed>('editor')
const pass = await editor.value?.validate() // => boolean
```

## 典型示例

### 多选 + 列插槽行内编辑

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UInput, UNumberInput, UTableEditor, defineTableColumns } from '@veltra/desktop'

const list = ref<any[]>([
  { id: 1, name: '张三', age: 28 },
  { id: 2, name: '李四', age: 32 }
])
const checked = ref<any[]>([])

const columns = defineTableColumns([
  { key: 'name', name: '姓名', minWidth: 150 },
  { key: 'age', name: '年龄', width: 120, align: 'center' }
])

function handleSubmit() {
  // 勾选行是原始数据引用，编辑后的值可直接读取
  console.log(checked.value.map((row) => row.name)) // => ['张三']
}
</script>

<template>
  <u-table-editor
    v-model="list"
    v-model:checked="checked"
    :columns="columns"
    row-key="id"
    checkable
    border
  >
    <template #column:name="{ model }">
      <u-input v-bind="model" />
    </template>
    <template #column:age="{ model }">
      <u-number-input v-bind="model" />
    </template>
  </u-table-editor>
  <button @click="handleSubmit">提交选中行</button>
</template>
```

### 从空数组开始增行

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UTableEditor, defineTableColumns } from '@veltra/desktop'

// 初始为空：空态区域自动渲染「添加」按钮，点击在末尾追加一行空对象
const list = ref<any[]>([])

const columns = defineTableColumns([
  { key: 'name', name: '商品', minWidth: 200 },
  { key: 'price', name: '单价', width: 120, align: 'right' }
])
</script>

<template>
  <u-table-editor v-model="list" :columns="columns" border />
</template>
```

### 列校验与整表提交

```vue
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import type { TableEditorColumn, TableEditorExposed } from '@veltra/desktop'
import { UInput, UTableEditor } from '@veltra/desktop'

const columns: TableEditorColumn[] = [
  { key: 'name', name: '姓名', minWidth: 150, rules: { required: '请输入姓名' } },
  { key: 'email', name: '邮箱', minWidth: 220, rules: { preset: 'email' } }
]

const list = ref<Record<string, any>[]>([
  { name: '张三', email: 'zhangsan@example.com' },
  { name: '', email: 'invalid-email' }
])
const editor = useTemplateRef<TableEditorExposed>('editor')

async function handleSubmit() {
  // 第 2 行姓名必填、邮箱格式均未通过：validate() resolve false，
  // 姓名列表头标红（气泡「第 2 行：请输入姓名」）、邮箱列表头标红（气泡「第 2 行：邮箱格式不正确」）
  const pass = (await editor.value?.validate()) ?? false
  if (pass) console.log('全部通过', list.value)
}
</script>

<template>
  <!-- 控件 change（失焦提交）即触发所在单元格校验，输入过程不校验 -->
  <u-table-editor ref="editor" v-model="list" :columns="columns" border>
    <template #column:name="{ model }">
      <u-input v-bind="model" />
    </template>
    <template #column:email="{ model }">
      <u-input v-bind="model" />
    </template>
  </u-table-editor>
  <button @click="handleSubmit">校验并提交</button>
</template>
```

### 只读展示（复用编辑配置）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UInput, UNumberInput, UTableEditor, defineTableColumns } from '@veltra/desktop'

const list = ref<any[]>([
  { id: 1, name: '张三', age: 28 },
  { id: 2, name: '李四', age: 32 }
])

const columns = defineTableColumns([
  { key: 'name', name: '姓名', minWidth: 150 },
  { key: 'age', name: '年龄', width: 120, align: 'center' }
])
</script>

<template>
  <!-- readonly：控件经插槽 model 收到 readonly: true（值不可修改），
       操作列与空态「添加」按钮不渲染；u-input 等按只读展示态渲染值 -->
  <u-table-editor v-model="list" :columns="columns" readonly border>
    <template #column:name="{ model }">
      <u-input v-bind="model" />
    </template>
    <template #column:age="{ model }">
      <u-number-input v-bind="model" />
    </template>
  </u-table-editor>
</template>
```

## 注意事项

> [!WARNING]
>
> - `UTableEditor` 内部就是 `UTable`：`data` 属性不存在，行数组用 `v-model`（`modelValue`）绑定；`stripe` / `showIndex` 被内部覆盖，传入不生效。
> - 禁止在 `columns` 里定义 `key: '__operation'` 的列，操作列 key 固定为 `__operation`，重复会导致渲染冲突。
> - `readonly: true` 时：插槽 `model` 携带 `readonly: true` 且不提供写回通道，输入控件值不可修改；操作列（表头与增删复制按钮）与空态「添加」按钮不渲染。
> - `readonly` 可随时切换，切换时全部单元格重挂载（值不丢，焦点不保留）；只读态插槽作用域与 `cell-click` 回调里的 `column.key` 带 `:ro` 后缀（如 `name:ro`），按列 key 匹配的逻辑要同时兼容两种形态。
> - 单元格编辑与增删复制行都触发 `update:modelValue`，payload 是浅拷贝新数组（行对象保持原引用）。监听单元格变化监听 `update:modelValue` 即可，不需要对 `list` 深度 `watch`。
> - 列校验是懒校验：单元格级只在控件 `change` 事件（如失焦提交）触发，输入过程不校验；`validate()` 整表校验自上而下逐行，某行未通过即停止其后的行。错误只在表头呈现（标红 + 感叹号气泡行号明细），单元格内无错误样式，也没有程序化读取错误明细的 API。
> - 「复制」用 `JSON` 深拷贝，行数据中的函数、`undefined` 字段、`Date` 对象会丢失；需要保真复制时不要用内置复制按钮，改用 `UTable` 自定义操作列。
> - 新增行插入的是空对象 `{}`，不含 `rowKey` 字段；依赖 `rowKey` 的受控选中要求新增后自行回填唯一键。
> - `tree` 与 `expandable` 互斥：树形模式下展开行（`#row:expand`）不渲染，需要行展开就不要设 `tree`。
> - 空态「添加」按钮只在非只读且 `modelValue` 为空时渲染；列表非空后只能用操作列的「新增」按钮增行。

## 常见问题

### `validate()` 返回 `false` 后，后面的行没有被校验

这是懒校验设计：整表校验自上而下逐行执行，某行存在未通过项即停止，其后各行保持未校验状态（表头气泡里也不含其明细）。悬停表头感叹号图标查看「第 N 行：<错误文案>」明细，修复该行后重调 `validate()` 会继续校验后面的行。

```ts
import { useTemplateRef } from 'vue'
import type { TableEditorExposed } from '@veltra/desktop'

const editor = useTemplateRef<TableEditorExposed>('editor')

const pass = await editor.value?.validate() // => false：第 2 行未通过，第 3 行起未校验
// 修复第 2 行后重调，才会校验到第 3 行及之后
const passAgain = await editor.value?.validate()
```

### 新增的行勾选后 `checked` 里匹配不到

原因：新增行是空对象 `{}`，没有 `rowKey` 对应字段的值，受控选中按 `rowData[rowKey]` 匹配。修复：在 `#column:{key}` 插槽里自行生成唯一键写回，或新增后用代码给新行回填 `id`。

### 想要空白表格但不显示内置「添加」按钮

只读场景直接设 `readonly`：空态不渲染「添加」按钮。需要可编辑但自定义空态时，`#empty` 插槽被内置空态占据（含「添加」按钮），改用 `UTable`（其 `#empty` 插槽默认渲染 `UEmpty`，可完全覆盖），或接受内置按钮行为。
