# fe — web-api

浏览器 Web API 封装：剪贴板和权限查询。

## clipboard

```ts
const clipboard = {
  copy(data: string | Blob | Array<string | Blob>): Promise<void>
  read(): Promise<Blob[]>
  readText(): Promise<string>
}
```

### `clipboard.copy`

写入剪贴板。先查询 `clipboard-write` 权限：
- 权限可用时 → 使用 `navigator.clipboard.write()` + `ClipboardItem`
- 权限不可用且为纯文本时 → 回退到 `document.execCommand('copy')`

```ts
import { clipboard } from '@cat-kit/fe'

// 写入文本
await clipboard.copy('hello world')

// 写入多类型（HTML + 纯文本）
await clipboard.copy([
  new Blob(['<b>hello</b>'], { type: 'text/html' }),
  new Blob(['hello'], { type: 'text/plain' })
])
```

### `clipboard.read`

读取剪贴板内容，返回 `Blob[]`。需要 `clipboard-read` 权限。

```ts
const items = await clipboard.read()
for (const blob of items) {
  if (blob.type === 'text/plain') {
    console.log(await blob.text())
  }
}
```

### `clipboard.readText`

读取纯文本剪贴板内容。浏览器权限不足时抛错。

```ts
const text = await clipboard.readText()
```

## queryPermission

```ts
type WebPermissionName = PermissionName | 'clipboard-read' | 'clipboard-write'

function queryPermission(name: WebPermissionName): Promise<boolean>
```

查询浏览器权限状态。若 `navigator.permissions.query()` 不可用，回退返回 `true`。

- **注意**：返回 `state !== 'denied'`，即 `prompt` 状态也视为"可能可用"

```ts
import { queryPermission } from '@cat-kit/fe'

const canClip = await queryPermission('clipboard-write')
if (canClip) {
  await clipboard.copy('text')
}
```

> 类型签名：`../../generated/fe/web-api/`
