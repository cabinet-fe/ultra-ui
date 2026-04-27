# fe — storage

类型安全的浏览器存储封装，支持过期时间、批量操作、变化监听。附带 Cookie 操作工具。

## WebStorage

```ts
const storage = {
  get local(): WebStorage     // 封装 localStorage
  get session(): WebStorage   // 封装 sessionStorage
}
```

### 类型安全的 Key

```ts
function storageKey<T>(str: string): StorageKey<T>
```

创建带类型标记的 key，`set`/`get` 时自动推断值类型。

```ts
import { storage, storageKey } from '@cat-kit/fe'

const userKey = storageKey<{ name: string; age: number }>('user')
const countKey = storageKey<number>('count')
const tagsKey = storageKey<string[]>('tags')

// 类型安全存取
storage.local.set(userKey, { name: 'Alice', age: 30 })
storage.local.set(countKey, 42, 3600)  // 1 小时后过期

const user = storage.local.get(userKey)    // { name, age } | null
const count = storage.local.get(countKey, 0) // number (带默认值)
```

### 方法

| 方法 | 签名 | 说明 |
|------|------|------|
| `.set(key, value, exp?)` | `set<T>(key: StorageKey<T>, value: T, exp?: number): WebStorage` | 存入值。`exp` 为过期秒数，0 或留空表示永不过期。支持 `string/number/object/boolean/bigint` |
| `.get(key)` | `get<T>(key: StorageKey<T>): T \| null` | 取单值。过期自动删除返回 null |
| `.get(key, defaultVal)` | `get<T>(key: StorageKey<T>, defaultVal: T): T` | 取单值，带默认值 |
| `.get(keys)` | `get<T>(keys: [...StorageKey[]]): T[]` | 批量取值，保持类型和顺序 |
| `.getExpire(key)` | `(key: StorageKey<any>): number` | 获取过期时间戳（ms），不存在返回 0 |
| `.remove(key)` | `remove(key): WebStorage` | 删除单个 |
| `.remove(keys)` | `remove(keys[]): WebStorage` | 批量删除 |
| `.remove()` | `remove(): WebStorage` | 清空全部 |
| `.on(key, cb)` | `(key: string, cb: Callback): void` | 监听 key 的变化 |
| `.off(key)` | `(key: string): void` | 移除监听 |

```ts
storage.local.on('user', () => {
  console.log('user changed')
})

// 批量读写
const [user, count] = storage.local.get([userKey, countKey] as const)
```

## Cookie

```ts
const cookie = {
  set(key: string, value: string, options?: CookieOptions): void
  get(key: string): string | null
  remove(key: string, options?: Pick<CookieOptions, 'path' | 'domain'>): void
  has(key: string): boolean
  getAll(): Record<string, string>
  clear(): void
}

interface CookieOptions {
  expires?: number | Date    // 秒数或 Date 对象
  path?: string              // 默认 '/'
  domain?: string
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}
```

```ts
import { cookie } from '@cat-kit/fe'

cookie.set('token', 'abc123', { expires: 86400, secure: true, sameSite: 'Lax' })
cookie.get('token')     // 'abc123'
cookie.has('token')     // true
cookie.remove('token')
cookie.clear()          // 清空所有（当前 path/domain 可写范围）
```

> 类型签名：`../../generated/fe/storage/`
