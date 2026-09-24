---
title: URichTextEditor 富文本编辑器
description: '基于 Lexical 0.50 封装的富文本编辑器：v-model 绑定 HTML 或 Lexical EditorState JSON 字符串，内置加粗、标题、列表、引用、链接、图片等工具栏，支持图片延迟上传（插入即时本地预览，提交时经 ref.uploadImages 统一上传换取服务器地址）、图片选中与拖拽缩放（尺寸随 HTML width/height 属性持久化）、占位文本、自定义工具栏、禁用只读与表单集成。'
aliases: [RichTextEditor, rich-text-editor, 富文本, RTE, 所见即所得编辑器, Lexical 封装]
keywords:
  [
    'update:modelValue',
    modelValue,
    format,
    toolbar,
    placeholder,
    image,
    ToolbarItem,
    RichTextFormat,
    RichTextImageUploader,
    RichTextEditorExposed,
    uploadImages,
    html,
    json,
    工具栏配置,
    行内代码,
    无序列表,
    有序列表,
    引用块,
    插入链接,
    插入图片,
    图片延迟上传,
    粘贴图片,
    拖拽图片,
    图片缩放,
    调整图片大小,
    图片选中,
    图片尺寸,
    blob URL,
    占位文本,
    撤销重做,
    标题下拉
  ]
---

# URichTextEditor 富文本编辑器

`@veltra/desktop` 导出 `URichTextEditor`（基于 Lexical 0.50 封装）与类型 `RichTextFormat`、`ToolbarItem`、`RichTextImageUploader`。组件用于编辑公告、正文等富文本内容：`v-model` 绑定字符串，`format` 决定序列化格式（默认 `'html'`），`toolbar` 按数组顺序配置工具栏按钮。支持图片输入（粘贴 / 拖拽 / 工具栏按钮，`image` 属性默认开启）：插入时以本地 `blob:` URL 即时预览、不上传，最终提交前调用 ref 上的 `uploadImages(upload)` 统一上传并返回替换为服务器地址后的最终内容。

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

/** 图片上传函数：接收文件，返回上传后的服务器地址 */
export type RichTextImageUploader = (file: File) => Promise<string>

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
  | 'image'
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
  /** 是否允许图片输入（粘贴 / 拖拽 / 工具栏按钮）。默认 true；false 时工具栏中的 'image' 项不渲染 */
  image?: boolean
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

/** ref 上可直接访问的方法形态 */
export interface RichTextEditorExposed {
  /**
   * 上传编辑器内所有待上传图片：对每张图片调用 upload 获取服务器地址并替换节点，
   * 返回替换后的最终内容（格式遵循 format 属性）。
   * 任一上传失败则整体拒绝（reject 原错误），图片保持待上传状态可整体重试；
   * 已上传的不会重复上传。编辑器未挂载时返回当前 model 值
   */
  uploadImages: (upload: RichTextImageUploader) => Promise<string>
}

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
  'link',
  '|',
  'image'
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

| 参数          | 类型                              | 默认              | 必填 | 约束                                                                |
| ------------- | --------------------------------- | ----------------- | :--: | ------------------------------------------------------------------- |
| `modelValue`  | `string`                          | `''`（空内容）    |  否  | 格式必须与 `format` 一致；不匹配时按空内容处理，不抛错              |
| `format`      | `'html' \| 'json'`                | `'html'`          |  否  | 切换 `format` 不会转换已有内容，必须初始就定好                      |
| `toolbar`     | `ToolbarItem[]`                   | `DEFAULT_TOOLBAR` |  否  | 元素仅限 15 个枚举值；`'                                            | '` 渲染分隔符；空数组不渲染工具栏 |
| `placeholder` | `string`                          | `''`              |  否  | 内容为空时显示；仅含图片（无文字）时不显示                          |
| `image`       | `boolean`                         | `true`            |  否  | 关闭后粘贴 / 拖拽图片文件不处理，工具栏 `'image'` 项不渲染          |
| `size`        | `'small' \| 'default' \| 'large'` | `'default'`       |  否  | 优先级：组件 props > UForm > 全局配置 > `'default'`                 |
| `label`       | `string`                          | —                 |  否  | 仅 UForm 内生效                                                     |
| `field`       | `string`                          | —                 |  否  | 仅 UForm 内生效；设置后禁止再写 `v-model`                           |
| `span`        | `number` / `'full'` / 对象        | —                 |  否  | 仅 UForm 内生效；对象键为 `xs`/`sm`/`md`/`lg`/`xl` 加必填 `default` |
| `tips`        | `string`                          | —                 |  否  | 仅 UForm 内生效                                                     |
| `disabled`    | `boolean`                         | `false`           |  否  | 工具栏按钮变为禁用态                                                |
| `readonly`    | `boolean`                         | `false`           |  否  | 工具栏整体不渲染                                                    |
| `rules`       | `ValidateRule`                    | —                 |  否  | 仅 UForm 内生效                                                     |

## 方法与事件

- `update:modelValue(value: string)`：输入、删除或工具栏操作导致内容变化时触发；`value` 按 `format` 序列化（`'html'` 用 Lexical 的 `$generateHtmlFromNodes`，`'json'` 用 `JSON.stringify(editorState.toJSON())`）。IME 组字进行中不触发，组字结束后同步。
- `uploadImages(upload: (file: File) => Promise<string>): Promise<string>`（ref 方法，异步）：上传编辑器内所有待上传图片。对每张图片调用 `upload`（并发 `Promise.all`），成功后把对应 `<img>` 的 `src` 从本地 `blob:` URL 替换为返回的服务器地址，并返回替换后的最终内容字符串（格式遵循 `format`；`v-model` 同步更新为同一结果）。错误：任一 `upload` 拒绝时整体 reject（透传原错误），已成功的替换不落地、全部图片保持待上传状态，可整体重试；上传进行中重复调用 reject `Error('图片正在上传中')`；组件未挂载时返回当前 `model` 值。幂等：已替换为服务器地址的图片不再上传，重复提交安全。
- 内置行为：撤销历史上限 300 步；`'heading'` 渲染为「正文 / Heading 1~6」下拉；`'link'` 点击后弹浏览器原生 `prompt` 输入 URL，取消或留空不插入，再点一次已有链接的文本则移除链接；`image` 开启时（默认）粘贴 / 拖拽图片文件与工具栏 `'image'` 按钮（弹出系统文件选择，`accept="image/*"` 多选）均插入图片，仅处理 `image/*` 类型文件，非图片文件走默认行为；`disabled` / `readonly` 状态下不处理图片输入。
- 图片选中与缩放（v1.9.0 起，`image` 开启且非 `disabled` / `readonly` 时可用）：点击图片选中（描边 + 右下角缩放手柄），拖拽手柄等比调整尺寸（最小 24px，最大不超过编辑区内容宽度），松手后尺寸写入节点并保持选中；`Esc` 取消选中；选中状态按 `Backspace` / `Delete` 删除图片；尺寸随序列化输出——`format="html"` 时导出 `<img>` 的 `width` / `height` 属性（未调整过的图片不输出这两个属性），`format="json"` 时为节点 `width` / `height` 字段；含 `width` / `height` 属性的既有 HTML 灌入组件时尺寸保留。

## 典型示例

### 图片延迟上传

插入（粘贴 / 拖拽 / 工具栏「图片」按钮）时图片以本地 `blob:` URL 即时预览，`File` 保存在组件内部、不进 `v-model` 值；提交时调用 ref 上的 `uploadImages`，由宿主提供的上传函数统一上传并换取服务器地址：

```vue
<script setup lang="ts">
import { shallowRef, useTemplateRef } from 'vue'
import { URichTextEditor } from '@veltra/desktop'

const content = shallowRef('')
const rte = useTemplateRef('rte')

async function submit() {
  // upload 接收 File、返回服务器地址；返回值为替换完成后的最终内容（格式遵循 format）
  const finalHtml = await rte.value!.uploadImages(file => uploadImageApi(file))
  await saveContentApi({ content: finalHtml })
}
</script>

<template>
  <u-rich-text-editor ref="rte" v-model="content" />

  <button @click="submit">提交</button>
</template>
```

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
>
> - 本库组件是 `URichTextEditor`，从 `@veltra/desktop` 导入；`lexical` 与 `@lexical/*`（`^0.50.0`）是 `@veltra/desktop` 的 `dependencies`，安装时自动带上，禁止手动安装其他版本的 Lexical；应用直接使用 Lexical API 时版本必须兼容 `^0.50.0`。
> - 在 UForm 中必须使用 `field` 绑定 model；已有 `field` 时禁止再写 `v-model`。
> - `format="json"` 的 `v-model` 是 Lexical EditorState 的 JSON 序列化，不是自定义 schema；HTML 字符串与 JSON 字符串禁止互灌，格式不匹配时解析失败按空内容处理（一个空段落），不抛错。
> - 图片延迟上传：未调用 `uploadImages` 前，含待上传图片的 `v-model` 值里图片 `src` 是 `blob:` URL，仅当前页面会话内有效；持久化（存库）前必须先 `await uploadImages(...)` 并保存其返回值，直接存含 `blob:` 的值会导致回显裂图。
> - 待上传的 `File` 只存在于当前编辑会话：把含 `blob:` 的值重新灌回组件（如刷新后回显）不会还原待上传状态，仅当普通图片地址显示（会话外 `blob:` 已失效）。
> - `image` 属性默认 `true`：存量页面粘贴 / 拖拽截图会开始插入图片；不需要图片的表单必须显式 `:image="false"`。
> - 缩放后的图片导出为带 `width` / `height` 属性的 `<img>`（v1.9.0 起）：宿主页面渲染保存的 HTML 时按属性尺寸显示；宿主若对 `img` 设置了全局 CSS（如 `img { width: 100% }`），CSS 优先级高于属性，会覆盖编辑时设定的尺寸。
> - 工具栏项 `'code'` 是行内代码格式；`'code-block'` 当前只渲染按钮，点击不执行任何格式化（未实现），需要代码块的页面改用 `UCodeEditor`。
> - `'link'` 通过浏览器原生 `prompt` 输入 URL，不是自定义弹窗；程序化设置链接需自行使用 Lexical 的 `TOGGLE_LINK_COMMAND`。
> - `readonly` 时工具栏整体不渲染；`disabled` 时按钮禁用但工具栏仍在。
> - 组件颜色依赖 `--u-*` 主题 token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`。

## 常见问题

### 保存的 JSON 回显为空

`v-model` 值与 `format` 不匹配（例如把 HTML 字符串灌进 `format="json"`）。修复：确认存库与回显用同一 `format`；存量 HTML 数据需先转换，组件不做格式转换。

### 工具栏点击无反应

检查两点：组件是否处于 `disabled`（按钮禁用）；对应工具栏项是否为 `'code-block'`（当前未实现命令，点击无效果）。修复：`disabled` 置 `false`，或把 `'code-block'` 从 `toolbar` 中移除。

### 存库的图片回显裂图

`v-model` 值里图片 `src` 是 `blob:` URL（存库前没调 `uploadImages`）。修复：提交链路改为先 `const content = await rte.value.uploadImages(uploadImageApi)` 再存 `content`；已存脏数据无法恢复原图，需用户重新插入。
