---
title: UFilePicker 文件选择器
description: 点击或拖拽拾取本地文件的拾取器，按 accept 过滤后通过 pick 事件返回 File 数组；支持多选、自定义渲染标签与拖拽高亮，用于文件上传入口。
aliases: [Uploader, FilePicker, file-picker, 文件上传, 上传组件]
keywords: [pick, accept, multiple, isDragover, tag, matchAccept, UploaderProps, "File[]", 文件上传, 拖拽上传, 点击上传, 图片上传, 多选文件, 限制文件类型, 上传入口]
---

# UFilePicker 文件选择器

`@veltra/desktop` 导出的文件拾取组件 `UFilePicker`：点击触发系统文件选择框、拖拽文件到组件上释放也能拾取，拾取结果按 `accept` 过滤后通过 `pick` 事件以 `File[]` 返回。组件本身不发起上传请求，只负责拾取；上传逻辑由 `pick` 回调自行实现。

## 快速上手

默认插槽放任意内容作为触发区，点击触发系统文件选择框，拾取结果从 `@pick` 拿：

```vue
<script setup lang="ts">
import { UButton, UFilePicker } from '@veltra/desktop'
import { shallowRef } from 'vue'

const files = shallowRef<File[]>([])
</script>

<template>
  <UFilePicker accept="image/*" multiple @pick="files = $event">
    <UButton>选择图片（可多选）</UButton>
  </UFilePicker>

  <ul>
    <li v-for="file of files" :key="file.name">{{ file.name }}</li>
  </ul>
</template>
```

## API 签名

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** 表单组件通用属性（UFilePicker 继承它，其中仅 disabled 影响拾取行为） */
export interface FormComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
  /** 在表单控件内时的提示 */
  tips?: string
  /** 所占列的大小 */
  span?: number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字 */
  label?: string
  /** 表单项字段 */
  field?: string
  /** 是否禁用；为 true 时点击、拖入均不响应 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 校验规则 */
  rules?: ValidateRule
}

/** 文件上传器组件属性 */
export interface UploaderProps extends FormComponentProps {
  /** 渲染标签。默认 'div' */
  tag?: string
  /** 允许拾取的文件类型，逗号分隔多个值，命中任一即通过 */
  accept?: string
  /** 是否允许多选。默认 false */
  multiple?: boolean
}

/** 文件上传器组件定义的事件 */
export interface UploaderEmits {
  /** 拾取完成；files 为通过 accept 过滤后的文件列表 */
  (e: 'pick', files: File[]): void
}

/** 无暴露方法；模板 ref 上没有可调用的成员 */
export type UploaderExposed = Record<string, never>
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `tag` | `string` | `'div'` | 否 | 组件根元素渲染的 HTML 标签，仅接受合法的标签名 |
| `accept` | `string` | `—`（不过滤） | 否 | 原生 `input[accept]` 语法：`*`、`*/*` 接受全部；`image/*` MIME 组；`application/pdf` 精确 MIME；`.pdf`、`.docx` 扩展名（不区分大小写）；逗号分隔多个值 |
| `multiple` | `boolean` | `false` | 否 | `false` 时系统文件框只能选 1 个；拖拽不受此限制，一次可拖入多个文件 |
| `disabled` | `boolean` | `false` | 否 | 继承自 `FormComponentProps`；`true` 时点击与拖拽拾取全部被禁用 |
| `size` / `label` / `field` / `span` / `tips` / `rules` | 见类型块 | `—` | 否 | 继承自 `FormComponentProps`；本组件内部未消费这些值，仅在 `UForm` 表单体系内按通用规则处理 |

## 方法与事件

### 事件 `pick`

- 签名：`(e: 'pick', files: File[]) => void`
- 触发时机：点击选择文件确认后，或拖拽文件释放（drop）后，各触发一次
- `files` 是通过 `accept` 过滤后的数组：`accept` 未设置时等于全部拾取文件；全部不匹配时为空数组 `[]`（事件仍会触发）
- 拖拽与点击在一次交互内只触发一次 `pick`；多次拾取的结果需要调用方自行合并

### 插槽

| 插槽 | 参数 | 说明 |
| --- | --- | --- |
| `default`（唯一插槽） | `{ isDragover: boolean }` | 触发区内容；`isDragover` 为 `true` 表示文件正悬停在组件上，用于高亮 |

## 典型示例

### 拖拽上传区 + 悬停高亮

```vue
<script setup lang="ts">
import { UFilePicker } from '@veltra/desktop'
import { shallowRef } from 'vue'

const files = shallowRef<File[]>([])
</script>

<template>
  <UFilePicker v-slot="{ isDragover }" multiple @pick="files = $event">
    <div class="drop-zone" :class="{ 'is-dragover': isDragover }">
      {{ isDragover ? '松开即可上传' : '将文件拖到此处，或点击上传' }}
    </div>
  </UFilePicker>

  <ul>
    <li v-for="file of files" :key="file.name">{{ file.name }}（{{ file.size }} 字节）</li>
  </ul>
</template>

<style scoped>
.drop-zone {
  padding: 40px 0;
  border: 1px dashed var(--u-border-color);
  text-align: center;
  cursor: pointer;
}
.drop-zone.is-dragover {
  border-color: var(--u-color-primary);
  background-color: var(--u-file-picker-hover-bg);
}
</style>
```

### 限制类型 + 自定义标签 + 合并多次拾取

```vue
<script setup lang="ts">
import { UFilePicker } from '@veltra/desktop'
import { shallowRef } from 'vue'

// 需要替换为你的上传接口地址
const UPLOAD_URL = '<上传接口地址>'

const files = shallowRef<File[]>([])

function onPick(picked: File[]) {
  // picked 里只有 .pdf 或图片；空数组表示全部不匹配
  files.value = [...files.value, ...picked]
}

async function uploadAll() {
  const body = new FormData()
  files.value.forEach((f) => body.append('files', f))
  await fetch(UPLOAD_URL, { method: 'POST', body })
}
</script>

<template>
  <UFilePicker tag="span" accept=".pdf,image/*" multiple @pick="onPick">
    <a href="javascript:void(0)">点击上传 PDF 或图片</a>
  </UFilePicker>
  <button :disabled="!files.length" @click="uploadAll">上传 {{ files.length }} 个文件</button>
</template>
```

## 注意事项

> [!WARNING]
> - 事件名是 `pick`，不是 `change`，也没有 `v-model`；拾取结果只通过 `@pick` 的 `File[]` 参数交付。
> - `multiple: false` 只限制系统文件框单选；拖拽一次仍可放入多个文件，需要单文件时在 `pick` 回调里取 `files[0]`。
> - `accept` 同时作用于原生文件框与拖拽过滤；拖入不匹配的文件被静默丢弃，`pick` 收到空数组时不等于用户没有操作。
> - 组件根节点带 `@click.stop`；包在可点击容器内时不会触发外层点击。
> - 原生 `input` 带 `capture="environment"`：移动端点击拾取会直接调起后置相机，桌面端无感知。
> - 放进 `UForm` 时必须用 `field` 绑定模型字段，禁止再写 `v-model`（本组件没有 `modelValue`，写了也无效）。
> - 在 UForm 中必须使用 field，禁止 v-model。
