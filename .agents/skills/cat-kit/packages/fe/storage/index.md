# fe — 浏览器存储

## 何时使用

类型化 Web Storage，或管理可由 JavaScript 访问的 Cookie。

## 推荐公开 API

`storage`、`storageKey`、`cookie`

```ts
import { cookie, storage, storageKey } from '@cat-kit/fe'

const TOKEN = storageKey<string>('token')
storage.local.set(TOKEN, 'abc', 3600)
storage.local.get(TOKEN)
cookie.set('theme', 'dark', { maxAge: 86400 })
```

详情见 [apis.md](apis.md)。

## 约束

- 过期单位为**秒**；`0` 表示不过期
- `null`/函数/symbol/`undefined` 等会静默跳过；`bigint` 可能在 JSON 序列化时抛错
- `storageKey` 运行时只是字符串
- `cookie.clear()` 只能清 `document.cookie` 可见项，无法可靠删除不同 path/domain 创建的 cookie

## 类型入口

[storage.d.ts](../../../generated/fe/storage/storage.d.ts) · [cookie.d.ts](../../../generated/fe/storage/cookie.d.ts)
