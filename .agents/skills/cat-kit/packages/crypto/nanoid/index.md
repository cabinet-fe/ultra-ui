# crypto — nanoid

## 何时使用

需要密码学安全的随机 ID 或随机字节时（非哈希/加密）。

## 推荐公开 API

`nanoid`、`customAlphabet`、`customRandom`、`random`、`urlAlphabet`

详情见 [apis.md](apis.md)。

```ts
import { customAlphabet, nanoid } from '@cat-kit/crypto'

const requestId = nanoid() // 默认长度 21
const createCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10)
const code = createCode()
```

## 约束

- 需要 `globalThis.crypto.getRandomValues`
- `random(bytes)`：整数尺寸 `0..1024`，否则 `RangeError`
- `nanoid(0)` 返回 `''`
- 请使用非空字母表与安全字节源；ID 为概率唯一，不能替代 DB 唯一约束

## 类型入口

[nanoid.d.ts](../../../generated/crypto/nanoid.d.ts)
