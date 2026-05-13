# UFilePicker — 文件选择器

> `import type { UploaderProps, UploaderEmits } from '@veltra/desktop'`

基于隐藏 `<input type="file">` 的文件选择组件，支持点击触发与拖拽上传，自动根据 `accept` 过滤文件。

## Import

```ts
import { UFilePicker } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `tag` | `string` | `'div'` | 渲染的根元素标签 |
| `accept` | `string` | — | 允许的文件类型（同 `<input accept>`，如 `"image/*"`、`".pdf,.docx"`、`"image/*,application/pdf"`） |
| `multiple` | `boolean` | `false` | 是否允许多选 |

继承自 `FormComponentProps`：

| prop | type | default | 说明 |
|------|------|---------|------|
| `size` | `ComponentSize` | — | `'small'` \| `'default'` \| `'large'` |
| `disabled` | `boolean` | `false` | 禁用状态，阻止点击与拖拽 |
| `readonly` | `boolean` | — | 只读状态 |
| `label` | `string` | — | 表单标签文字 |
| `field` | `string` | — | 表单项字段名 |
| `tips` | `string` | — | 表单内的提示文字 |
| `span` | `number \| 'full' \| BreakpointSpan` | — | 所占列大小 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `pick` | `(files: File[])` | 文件拾取完成时触发，返回已通过 `accept` 过滤的 `File` 数组 |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ isDragover: boolean }` | 自定义渲染区域，`isDragover` 在拖拽文件悬停时为 `true`，可用于高亮 |

## Exposed

无暴露属性。

## Examples

### 基础点击选择

```vue
<script setup>
const handlePick = (files: File[]) => {
  console.log('选中文件:', files.map(f => f.name))
}
</script>

<template>
  <u-file-picker @pick="handlePick">
    <button>选择文件</button>
  </u-file-picker>
</template>
```

### 限制类型 & 多选

```vue
<script setup>
const handlePick = (files: File[]) => {
  // 仅 .pdf 或 image 文件会进入 files
  console.log(files)
}
</script>

<template>
  <u-file-picker
    accept=".pdf,image/*"
    multiple
    @pick="handlePick"
  >
    <button>上传 PDF 或图片（可多选）</button>
  </u-file-picker>
</template>
```

### 拖拽上传 + 拖拽高亮

```vue
<script setup>
const handlePick = (files: File[]) => {
  console.log('拖入文件:', files.map(f => f.name))
}
</script>

<template>
  <u-file-picker @pick="handlePick" v-slot="{ isDragover }">
    <div :class="['drop-zone', isDragover && 'drop-zone--active']">
      {{ isDragover ? '松开即可上传' : '拖拽文件到此处，或点击选择' }}
    </div>
  </u-file-picker>
</template>

<style scoped>
.drop-zone {
  padding: 40px;
  border: 2px dashed #ccc;
  text-align: center;
  cursor: pointer;
}
.drop-zone--active {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.1);
}
</style>
```

### 自定义渲染标签

```vue
<template>
  <u-file-picker tag="span" accept="image/*" @pick="onPick">
    <a href="javascript:void(0)">点击上传图片</a>
  </u-file-picker>
</template>
```
