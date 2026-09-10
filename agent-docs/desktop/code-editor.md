---
title: UCodeEditor 代码编辑器
description: "基于 CodeMirror 6 封装的代码编辑器：内置 js、sql、java、json、markdown、spel、bash、powershell 语法高亮与语言选择器，支持函数体前后缀外壳、一键放大与暗色主题，v-model 绑定纯文本代码。"
aliases: [CodeEditor, code-editor, CodeMirror 封装, 代码输入框, 脚本编辑器]
keywords: ["update:lang", "update:modelValue", CodeEditorLang, modelValue, langs, lang, defaultLines, zoomable, prefix, suffix, dark, readonly, 语法高亮, 语言切换, 放大编辑, 暗色主题, 只读展示, 脚本编辑, 函数体外壳, 自动补全]
---

# UCodeEditor 代码编辑器

`@veltra/desktop` 导出 `UCodeEditor`（基于 CodeMirror 6 封装）与语言标识类型 `CodeEditorLang`。组件用于编辑代码片段与脚本：内置 8 种语言语法高亮、行号、折叠、自动补全、搜索高亮与撤销历史；`v-model` 绑定纯文本正文，`prefix` / `suffix` 提供不可编辑的外壳，工具栏支持语言切换与一键放大。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UCodeEditor } from '@veltra/desktop'

const code = shallowRef('console.log("Hello, World!")')
</script>

<template>
  <!-- 单一语言：langs 只放一个，顶部显示大写语言名标签 JS -->
  <u-code-editor v-model="code" :langs="['js']" />
  <!-- => 用户输入后 code.value 同步为编辑器正文（不含外壳） -->
</template>
```

`v-model` 绑定 `string`。`langs` 多于一种时顶部出现语言选择器；当前语言用 `lang` / `v-model:lang` 控制，未设置时回落 `langs[0]`。

## API 签名

```ts
/** 语言标识枚举，仅以下 8 个值 */
export type CodeEditorLang =
  | 'js'
  | 'sql'
  | 'java'
  | 'json'
  | 'markdown'
  | 'spel'
  | 'bash'
  | 'powershell'

export interface CodeEditorProps {
  /** 绑定代码正文（不含 prefix/suffix 外壳）。undefined 视同 '' */
  modelValue?: string
  /**
   * 可选语言列表；长度大于 1 时顶部工具栏显示语言选择器，
   * 仅 1 种时显示大写语言名标签（如 JS、SQL），空数组时无语法高亮
   */
  langs?: CodeEditorLang[]
  /** 当前语言，配合 v-model:lang 使用；未设置时回落 langs[0] */
  lang?: CodeEditorLang
  /** 不可编辑的前缀外壳，展示在编辑器内，不计入 v-model */
  prefix?: string
  /** 不可编辑的后缀外壳，展示在编辑器内，不计入 v-model */
  suffix?: string
  /** 是否使用暗色主题（CodeMirror oneDark）。默认 false */
  dark?: boolean
  /** 是否显示放大按钮。默认 true；false 时不渲染放大按钮 */
  zoomable?: boolean
  /** 默认显示行数，撑起编辑器最小高度，超出后滚动；小于 1 按 1 处理。默认 8 */
  defaultLines?: number
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
  /** 禁用（不可编辑）。默认 false；未设置时优先继承 UForm 的 disabled */
  disabled?: boolean
  /** 只读（内容不可改，仍可选中复制）。默认 false；未设置时优先继承 UForm 的 readonly */
  readonly?: boolean
  /** 校验规则，仅在 UForm 内生效 */
  rules?: ValidateRule
}

export interface CodeEditorEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'update:lang', value: CodeEditorLang | undefined): void
  /** 编辑器失焦且自聚焦以来内容有变更时触发 */
  (e: 'change', value: string): void
}

/** ref 上可直接访问的形态：DeconstructValue 解包空对象后无任何成员，ref 上无可用方法 */
export type CodeEditorExposed = {}

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
| `modelValue` | `string` | `''`（undefined 视同 `''`） | 否 | 仅正文，不含 `prefix` / `suffix` |
| `langs` | `CodeEditorLang[]` | `[]` | 否 | 元素仅限 8 个枚举值；长度大于 1 出选择器，等于 1 出标签，等于 0 无高亮 |
| `lang` | `CodeEditorLang` | 未设置时回落 `langs[0]` | 否 | 必须是 `langs` 中的值；`langs` 变化后若不在列表中会被自动纠正为 `langs[0]` |
| `prefix` | `string` | — | 否 | 渲染为编辑器内只读区域，不计入 `v-model` |
| `suffix` | `string` | — | 否 | 同 `prefix` |
| `dark` | `boolean` | `false` | 否 | 切换时热更新编辑器主题 |
| `zoomable` | `boolean` | `true` | 否 | `false` 时不渲染放大按钮 |
| `defaultLines` | `number` | `8` | 否 | 最小按 1 处理；仅撑最小高度，超出滚动 |
| `label` | `string` | — | 否 | 仅 UForm 内生效 |
| `field` | `string` | — | 否 | 仅 UForm 内生效；设置后禁止再写 `v-model` |
| `span` | `number` / `'full'` / 对象 | — | 否 | 仅 UForm 内生效；对象键为 `xs`/`sm`/`md`/`lg`/`xl` 加必填 `default` |
| `tips` | `string` | — | 否 | 仅 UForm 内生效 |
| `disabled` | `boolean` | `false` | 否 | 优先级：组件 props > UForm > 全局配置 > `false` |
| `readonly` | `boolean` | `false` | 否 | 优先级同 `disabled` |
| `rules` | `ValidateRule` | — | 否 | 仅 UForm 内生效 |

## 方法与事件

- `update:modelValue(value: string)`：编辑内容变化时触发（含初始化与外部回写后的差异同步）；IME 组字进行中不触发，组字结束后统一补一次。
- `update:lang(value: CodeEditorLang | undefined)`：语言选择器切换，或 `langs` 变化触发内部纠正时触发。配合 `v-model:lang` 使用。
- `change(value: string)`：编辑器失焦且自聚焦以来内容有变更时触发，payload 为当前正文。
- 暴露方法：无。`CodeEditorExposed` 为空对象类型，通过 ref 调用方法不可用；控制内容一律走 `v-model`。

## 典型示例

### 多语言切换（受控 lang）

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UCodeEditor } from '@veltra/desktop'
import type { CodeEditorLang } from '@veltra/desktop'

const code = shallowRef('SELECT id, name FROM users WHERE status = 1')
const lang = shallowRef<CodeEditorLang>('sql')

function onLangChange(next: CodeEditorLang) {
  // 选择器切换语言时触发；lang 已由 v-model:lang 同步
  console.log(next) // => 'json'
}
</script>

<template>
  <!-- langs 多于一种：顶部渲染语言选择器（选项为大写语言名） -->
  <u-code-editor v-model="code" v-model:lang="lang" :langs="['sql', 'json', 'js']" />
  <p>当前语言：{{ lang }}</p>
</template>
```

### 函数体外壳（prefix / suffix）

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UCodeEditor } from '@veltra/desktop'

// v-model 只绑正文；前后缀展示在编辑器内且不可编辑、不被选中修改
const body = shallowRef('  return a + b')
const prefix = 'function handle(a, b) {\n'
const suffix = '\n}'
</script>

<template>
  <u-code-editor v-model="body" :langs="['js']" :prefix="prefix" :suffix="suffix" />
  <!-- body.value 始终只有 '  return a + b'，提交时自行拼接 prefix + body + suffix -->
</template>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UForm, UCodeEditor } from '@veltra/desktop'

const form = reactive({ script: '' })

function submit() {
  // 校验通过后 form.script 即为编辑器正文
  console.log(form.script) // => 'const x = 1'
}
</script>

<template>
  <!-- 表单内用 field 绑定 model，禁止再写 v-model -->
  <u-form :model="form">
    <u-code-editor
      label="自定义脚本"
      field="script"
      :langs="['js']"
      :default-lines="12"
      :rules="{ required: true }"
      tips="请输入合法的 JavaScript 代码"
    />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
> - 本库组件是 `UCodeEditor`，从 `@veltra/desktop` 导入；CodeMirror 6 相关包在构建时已打包进产物，使用者禁止再安装 `@codemirror/*`，安装 `@veltra/desktop` 即可用。
> - 在 UForm 中必须使用 `field` 绑定 model；已有 `field` 时禁止再写 `v-model`。
> - `v-model` 是正文；`prefix` / `suffix` 是不可编辑外壳，不会出现在 `v-model` 里，提交完整文本必须自行拼接。
> - `lang` 仅接受 `'js' | 'sql' | 'java' | 'json' | 'markdown' | 'spel' | 'bash' | 'powershell'` 8 个值；`langs` 传空数组时无语法高亮、顶部无语言标签。
> - 本组件不支持 `size` 属性（类型上已剔除）；`disabled` / `readonly` / `size` 类回退属性继承自 UForm。
> - 语言包按需动态加载：首次切换到某语言时异步载入语法扩展，同一语言多次切换不会重复加载。
> - 编辑器内 Tab 键固定为缩进，不会把焦点移出编辑器。
> - 组件颜色依赖 `--u-*` 主题 token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`。

## 常见问题

### 顶部没有出现语言选择器

`langs` 长度小于等于 1 时不渲染选择器：等于 1 时显示大写语言名标签，等于 0 时无任何语言 UI。修复：把至少 2 个语言放进 `langs`。

```vue
<u-code-editor v-model="code" :langs="['js', 'sql']" />
```

### 输入中文（IME 组字）过程中 `v-model` 不更新

组字进行中组件刻意不同步，避免中间态触发父级重渲染；组字结束后会统一同步一次最终文本。禁止在 `update:modelValue` 回调里对组字中间态做校验提示，改用 `change`（失焦触发）做提交前校验。
