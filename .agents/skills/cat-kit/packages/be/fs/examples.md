# 文件系统 — 示例

```ts
import { ensureDir, readDir, writeJson } from '@cat-kit/be'

await ensureDir('./output')
const files = await readDir('./data', { recursive: true, onlyFiles: true })
await writeJson('./output/files.json', { files })
```
