# 浏览器文件 — API

```ts
interface ReadChunksOptions {
  chunkSize?: number
  offset?: number
}

declare function readChunks(
  file: Blob | File,
  options?: ReadChunksOptions
): AsyncGenerator<Uint8Array>

declare function saveBlob(blob: Blob, filename: string): void
```
