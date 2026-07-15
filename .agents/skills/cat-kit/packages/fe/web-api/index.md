# fe — Web API

## 何时使用

读写剪贴板，或预查浏览器权限状态（不发起授权请求）。

## 推荐公开 API

`clipboard`、`queryPermission`

```ts
import { clipboard, queryPermission } from '@cat-kit/fe'

await clipboard.copy('done')
const text = await clipboard.readText()
const ok = await queryPermission('clipboard-write')
```

详情见 [apis.md](apis.md)。

## 约束

- `queryPermission`：仅 `denied` 为 `false`；`prompt` 为 `true`；查询失败视为可写/可用（`true`）；**不**弹出授权
- 文本复制旧回退路径可能对非字符串使用 `JSON.stringify`（可能带引号）

## 类型入口

[clipboard.d.ts](../../../generated/fe/web-api/clipboard.d.ts) · [permission.d.ts](../../../generated/fe/web-api/permission.d.ts)
