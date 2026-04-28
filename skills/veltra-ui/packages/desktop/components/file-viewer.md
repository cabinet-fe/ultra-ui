# UFileViewer — 文件查看器

> `import type { FileViewerProps, FileViewerEmits } from '@veltra/desktop'`

## Import

```ts
import { UFileViewer } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `files` | `FileViewerItem[]` | — | 文件列表
| `modelValue` | `string` | — | 当前激活的文件 ID
| `sidebarWidth` | `string \| number \| false` | `280px` | 侧栏宽度
| `sheetMaxRows` | `number` | `50000` | 表格最大行数
| `downloadable` | `boolean` | `true` | 是否可下载
| `open` | `boolean` | — | 是否打开
| `closeOnClickBackdrop` | `boolean` | `true` | 点击遮罩关闭
| `closeOnEsc` | `boolean` | `true` | 按 Esc 关闭

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(id: string)` — 文件切换
| `update:open` | `(value: boolean)` — 打开状态变化
| `change` | `(file: FileViewerItem)` — 文件切换
| `error` | `(err: { file: FileViewerItem, error: unknown })` — 加载错误

## Exposed

```ts
interface FileViewerExposed {
  activeId: ShallowRef<string | undefined>
  activate: (id: string) => void
  next: () => void
  prev: () => void
}
```

## Examples

```vue
<u-file-viewer :files="files" />
```
