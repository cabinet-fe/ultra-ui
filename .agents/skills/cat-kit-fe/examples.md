# @cat-kit/fe 示例

## 分块读文件

```ts
import { readChunks } from '@cat-kit/fe'

const file = (document.querySelector('input[type=file]') as HTMLInputElement).files?.[0]
if (file) {
  for await (const chunk of readChunks(file)) {
    // 处理 chunk
  }
}
```

## 剪贴板

```ts
import { clipboard } from '@cat-kit/fe'

await clipboard.writeText('hello')
```

详见 [`generated/index.d.ts`](generated/index.d.ts)。
