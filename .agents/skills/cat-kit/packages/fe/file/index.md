# fe — 浏览器文件

## 何时使用

分块读取 `Blob`/`File`，或触发 Blob 下载。

## 推荐公开 API

`readChunks`、`saveBlob`

```ts
import { readChunks, saveBlob } from '@cat-kit/fe'

for await (const chunk of readChunks(file, { chunkSize: 1024 * 1024 })) {
  void chunk
}
saveBlob(new Blob(['hi']), 'hello.txt')
```

详情见 [apis.md](apis.md)。

## 约束

- 调用方保证 `chunkSize > 0` 且 `0 <= offset <= file.size`；`chunkSize: 0` 不会前进
- `saveBlob` 依赖浏览器下载能力

## 类型入口

[read.d.ts](../../../generated/fe/file/read.d.ts) · [saver.d.ts](../../../generated/fe/file/saver.d.ts)
