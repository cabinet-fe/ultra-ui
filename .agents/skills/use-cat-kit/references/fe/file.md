# fe — 文件操作

## 分块读取

```typescript
import { readChunks } from '@cat-kit/fe'

for await (const chunk of readChunks(file, {
  chunkSize?: number,    // 默认 10MB
  offset?: number        // 默认 0
})) {
  // 处理每个 Uint8Array chunk
}
```

## 保存文件

```typescript
import { saveBlob } from '@cat-kit/fe'

saveBlob(blob, 'output.txt')
```
