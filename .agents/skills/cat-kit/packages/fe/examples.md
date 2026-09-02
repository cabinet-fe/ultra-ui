# @cat-kit/fe — 组合示例

```ts
import {
  clipboard,
  readChunks,
  storage,
  storageKey,
  Virtualizer
} from '@cat-kit/fe'

const FILE_KEY = storageKey<string>('last-file-name')

async function upload(file: File) {
  storage.local.set(FILE_KEY, file.name, 0)
  for await (const chunk of readChunks(file, { chunkSize: 512 * 1024 })) {
    void chunk
  }
  await clipboard.copy(`uploaded:${file.name}`)
}

const list = new Virtualizer({ count: 1000, estimateSize: () => 36 })
list.setViewport(600)
list.subscribe(({ items }) => {
  void items
})
```
