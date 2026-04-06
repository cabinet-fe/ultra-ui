# excel — 读写与流式解析

## writeWorkbook

```typescript
import { writeWorkbook } from '@cat-kit/excel'

const bytes: Uint8Array = writeWorkbook(workbook, {
  dateSystem?: 1900 | 1904,
  useSharedStrings?: boolean,   // 默认 true
  compressionLevel?: number
})
```

## readWorkbook

```typescript
import { readWorkbook } from '@cat-kit/excel'

const wb = await readWorkbook(input, { dateSystem?: 1900 | 1904 })
// input: Uint8Array | ArrayBuffer | Blob | ReadableStream | AsyncIterable
```

## readWorkbookStream

逐行事件解析，适合大文件。

```typescript
import { readWorkbookStream } from '@cat-kit/excel'

for await (const event of readWorkbookStream(input, {
  sheets?: string[],
  includeEmptyRows?: boolean
})) {
  // event.type: 'sheetStart' | 'row' | 'sheetEnd'
  // row 事件: { sheetName, sheetIndex, rowIndex(1-based), values: CellValue[] }
}
```
