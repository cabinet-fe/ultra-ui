# fe — file

浏览器端文件操作：分块读取和保存下载。

## readChunks

```ts
async function* readChunks(
  file: Blob | File,
  options?: ReadChunksOptions
): AsyncGenerator<Uint8Array>

interface ReadChunksOptions {
  chunkSize?: number   // 默认 10MB (10 * 1024 * 1024)
  offset?: number      // 起始偏移，默认 0
}
```

分块异步读取文件，返回 `AsyncGenerator<Uint8Array>`。使用 `Blob.slice()` + `arrayBuffer()`，不用 `FileReader`。

- 支持 `for-await-of` 遍历
- 支持 `break` 提前退出
- 无需 abort — 停止迭代即可中断

```ts
import { readChunks } from '@cat-kit/fe'

const file = document.querySelector('input[type=file]')!.files![0]
if (!file) return

// 分块读取
for await (const chunk of readChunks(file, { chunkSize: 1024 * 1024 })) {
  console.log(`读取了 ${chunk.byteLength} 字节`)
}

// 边读边计算哈希
const hasher = new Uint8Array(32)
for await (const chunk of readChunks(file)) {
  // update hash with chunk
}
```

## saveBlob

```ts
function saveBlob(blob: Blob, filename: string): void
```

将 `Blob` 下载到本地。创建临时 `<a>` 标签触发下载，自动清理 `URL.createObjectURL` 资源。

- **适用场景**：小到中文件（< 500MB），大数据量建议用 `Streams API`

```ts
import { saveBlob } from '@cat-kit/fe'

const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
saveBlob(blob, 'data.json')
```

> 类型签名：`../../generated/fe/file/`
