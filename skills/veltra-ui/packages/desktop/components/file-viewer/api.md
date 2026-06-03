# UFileViewer — 文件查看器

> `import type { FileViewerProps, FileViewerEmits, FileViewerExposed, FileViewerItem, FileViewerKind } from '@veltra/desktop'`

> 类型：`../../../generated/types/file-viewer.ts`

支持预览 image、video、pdf、sheet（xlsx/csv）、docx、text 六类文件。内置侧栏文件列表、缩放拖拽、分页切换、下载功能，支持内嵌和全屏模态两种模式。

## Import

```ts
// UFileViewer 由 Vite 自动导入，无需手动 import
```

### FileViewerItem

```ts
interface FileViewerItem {
  /** 唯一 id；未提供时组件内部按索引生成 */
  id?: string
  /** 展示名（通常为原始文件名） */
  name: string
  /**
   * 文件源：
   * - string: URL（支持 http(s):、blob:、data:）
   * - File / Blob / ArrayBuffer / Uint8Array: 二进制原始数据
   */
  src: string | File | Blob | ArrayBuffer | Uint8Array
  /** 类型；缺省时根据 name 后缀推断 */
  kind?: FileViewerKind
  /** MIME type，仅用于原生 <video> / <img> / 下载时的类型提示 */
  mime?: string
  /** 文件大小（字节），可选，仅用于侧栏展示 */
  size?: number
}

type FileViewerKind = 'image' | 'video' | 'pdf' | 'sheet' | 'docx' | 'text'
```

> **类型推断规则**：`kind` 缺省时根据 `name` 后缀自动推断 — `png/jpg/gif/webp/...` → image、`mp4/webm/mov/...` → video、`pdf` → pdf、`xlsx/csv/...` → sheet、`docx` → docx、`txt/md/json/ts/...` → text。

> 示例见 [examples.md](./examples.md)
