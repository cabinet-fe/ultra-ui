---
title: URichTextEditor 富文本编辑器
description: "基于 Lexical 0.50 封装的富文本编辑器：v-model 绑定 HTML 或 Lexical EditorState JSON 字符串，内置加粗、标题、列表、引用、链接等工具栏，支持占位文本、自定义工具栏、禁用只读与表单集成。"
aliases: [RichTextEditor, rich-text-editor, 富文本, RTE, 所见即所得编辑器, Lexical 封装]
keywords: ["update:modelValue", modelValue, format, toolbar, placeholder, ToolbarItem, RichTextFormat, html, json, 工具栏配置, 行内代码, 无序列表, 有序列表, 引用块, 插入链接, 占位文本, 撤销重做, 标题下拉]
---

# URichTextEditor 富文本编辑器

`@veltra/desktop` 导出 `URichTextEditor`（基于 Lexical 0.50 封装）与类型 `RichTextFormat`、`ToolbarItem`。组件用于编辑公告、正文等富文本内容：`v-model` 绑定字符串，`format` 决定序列化格式（默认 `'html'`），`toolbar` 按数组顺序配置工具栏按钮。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { URichTextEditor } from '@veltra/desktop'

// format 默认 'html'，v-model 绑定 HTML 字符串
const content = shallowRef('<p>Hello</p>')
</script>

<template>
  <u-rich-text-editor v-model="content" placeholder="请输入内容" />
  <!-- => 用户加粗一段文字后 content.value 形如 '<p>Hello<strong>World</strong></p>' -->
</template>
```

## API 签名

```ts
/** v-model 数据格式 */
export type RichTextFormat = 'html' | 'json'

/** 工具栏项；'|' 为分隔符，其余为按钮 */
export type ToolbarItem =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code'
  | 'heading'
  | 'bullet-list'
  | 'ordered-list'
  | 'blockquote'
  | 'code-block'
  | 'link'
  | 'undo'
  | 'redo'
  | '|'

export interface RichTextEditorProps {
  /** 绑定内容字符串，格式由 format 决定。undefined 视同空内容 */
  modelValue?: string
  /** 数据格式：'html'（默认）或 'json'（Lexical EditorState 的 JSON 序列化） */
  format?: RichTextFormat
  /** 工具栏配置，按数组顺序渲染；空数组时不渲染工具栏。默认见下方 DEFAULT_TOOLBAR */
  toolbar?: ToolbarItem[]
  /** 占位文本，内容为空时显示。默认 '' */
  placeholder?: string
  /** 组件尺寸 */
  size?: 'small' | 'default' | 'large'
  /** 表单标签文字，仅在 UForm 内生效 */
  label?: string
  /** 表单字段名；在 UForm 内用 field 绑定 model，此时禁止再写 v-model */
  field?: string
  /** 所占列大小，仅在 UForm 内生效 */
  span?:
    | number
    | 'full'
    | ({ [key in 'xs' | 'sm' | 'md' | 'lg' | 'xl']?: 'full' | number } & {
        default: number | 'full'
      })
  /** 在表单控件内时的提示，仅在 UForm 内生效 */
  tips?: string
  /** 禁用（编辑区不可写，工具栏按钮禁用）。默认 false；未设置时优先继承 UForm 的 disabled */
  disabled?: boolean
  /** 只读（编辑区不可写，工具栏整体不渲染）。默认 false；未设置时优先继承 UForm 的 readonly */
  readonly?: boolean
  /** 校验规则，仅在 UForm 内生效 */
  rules?: ValidateRule
}

export interface RichTextEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** ref 上可直接访问的形态：DeconstructValue 解包空对象后无任何成员，ref 上无可用方法 */
export type RichTextEditorExposed = {}

/** toolbar 未设置时的默认值 */
export const DEFAULT_TOOLBAR: ToolbarItem[] = [
  'undo',
  'redo',
  '|',
  'heading',
  '|',
  'bold',
  'italic',
  'underline',
  'strikethrough',
  '|',
  'bullet-list',
  'ordered-list',
  '|',
  'blockquote',
  '|',
  'link'
]

export interface ValidateRule {
  /** 是否必填 */
  required?: boolean | string
  /** 长度单位 */
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
  /** 预设：'email' | 'phone' | 'num' | 'url' | 'idCard' */
  preset?: 'email' | 'phone' | 'num' | 'url' | 'idCard'
  /** 自定义校验 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `string` | `''`（空内容） | 否 | 格式必须与 `format` 一致；不匹配时按空内容处理，不抛错 |
| `format` | `'html' \| 'json'` | `'html'` | 否 | 切换 `format` 不会转换已有内容，必须初始就定好 |
| `toolbar` | `ToolbarItem[]` | `DEFAULT_TOOLBAR` | 否 | 元素仅限 14 个枚举值；`'|'` 渲染分隔符；空数组不渲染工具栏 |
| `placeholder` | `string` | `''` | 否 | 内容为空时显示 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 优先级：组件 props > UForm > 全局配置 > `'default'` |
| `label` | `string` | — | 否 | 仅 UForm 内生效 |
| `field` | `string` | — | 否 | 仅 UForm 内生效；设置后禁止再写 `v-model` |
| `span` | `number` / `'full'` / 对象 | — | 否 | 仅 UForm 内生效；对象键为 `xs`/`sm`/`md`/`lg`/`xl` 加必填 `default` |
| `tips` | `string` | — | 否 | 仅 UForm 内生效 |
| `disabled` | `boolean` | `false` | 否 | 工具栏按钮变为禁用态 |
| `readonly` | `boolean` | `false` | 否 | 工具栏整体不渲染 |
| `rules` | `ValidateRule` | — | 否 | 仅 UForm 内生效 |

## 方法与事件

- `update:modelValue(value: string)`：输入、删除或工具栏操作导致内容变化时触发；`value` 按 `format` 序列化（`'html'` 用 Lexical 的 `$generateHtmlFromNodes`，`'json'` 用 `JSON.stringify(editorState.toJSON())`）。IME 组字进行中不触发，组字结束后同步。
- 暴露方法：无。`RichTextEditorExposed` 为空对象类型；控制内容一律走 `v-model`。
- 内置行为：撤销历史上限 300 步；`'heading'` 渲染为「正文 / Heading 1~6」下拉；`'link'` 点击后弹浏览器原生 `prompt` 输入 URL，取消或留空不插入，再点一次已有链接的文本则移除链接。

## 典型示例

### 自定义工具栏

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { URichTextEditor } from '@veltra/desktop'

const content = shallowRef('<p>公告正文</p>')
</script>

<template>
  <!-- 只保留标题、加粗、斜体、无序列表与链接 -->
  <u-rich-text-editor
    v-model="content"
    :toolbar="['heading', '|', 'bold', 'italic', '|', 'bullet-list', '|', 'link']"
    placeholder="请输入公告内容"
  />
  <!-- => content.value 形如 '<h1>标题</h1><ul><li>项目</li></ul>' -->
</template>
```

### JSON 格式保存与回显

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { URichTextEditor } from '@veltra/desktop'

// format="json" 时 v-model 是 Lexical EditorState 的 JSON 字符串
const state = shallowRef(
  '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}'
)

function save() {
  // 把 state.value 直接存库；回显时原样灌回即可
  console.log(state.value.length) // => JSON 字符串长度
}
</script>

<template>
  <u-rich-text-editor v-model="state" format="json" placeholder="请输入内容" />
</template>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UForm, URichTextEditor } from '@veltra/desktop'

const formData = reactive({ content: '' })

function submit() {
  // formData.content 为 HTML 字符串
  console.log(formData.content) // => '<p>正文</p>'
}
</script>

<template>
  <!-- 表单内用 field 绑定 model，禁止再写 v-model -->
  <u-form :model="formData">
    <u-rich-text-editor
      label="正文"
      field="content"
      placeholder="请输入富文本内容"
      :rules="{ required: true }"
    />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
> - 本库组件是 `URichTextEditor`，从 `@veltra/desktop` 导入；`lexical` 与 `@lexical/*`（`^0.50.0`）是 `@veltra/desktop` 的 `dependencies`，安装时自动带上，禁止手动安装其他版本的 Lexical；应用直接使用 Lexical API 时版本必须兼容 `^0.50.0`。
> - 在 UForm 中必须使用 `field` 绑定 model；已有 `field` 时禁止再写 `v-model`。
> - `format="json"` 的 `v-model` 是 Lexical EditorState 的 JSON 序列化，不是自定义 schema；HTML 字符串与 JSON 字符串禁止互灌，格式不匹配时解析失败按空内容处理（一个空段落），不抛错。
> - 工具栏项 `'code'` 是行内代码格式；`'code-block'` 当前只渲染按钮，点击不执行任何格式化（未实现），需要代码块的页面改用 `UCodeEditor`。
> - `'link'` 通过浏览器原生 `prompt` 输入 URL，不是自定义弹窗；程序化设置链接需自行使用 Lexical 的 `TOGGLE_LINK_COMMAND`。
> - `readonly` 时工具栏整体不渲染；`disabled` 时按钮禁用但工具栏仍在。
> - 组件颜色依赖 `--u-*` 主题 token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`。

## 常见问题

### 保存的 JSON 回显为空

`v-model` 值与 `format` 不匹配（例如把 HTML 字符串灌进 `format="json"`）。修复：确认存库与回显用同一 `format`；存量 HTML 数据需先转换，组件不做格式转换。

### 工具栏点击无反应

检查两点：组件是否处于 `disabled`（按钮禁用）；对应工具栏项是否为 `'code-block'`（当前未实现命令，点击无效果）。修复：`disabled` 置 `false`，或把 `'code-block'` 从 `toolbar` 中移除。
