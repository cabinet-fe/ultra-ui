# fe — 存储

## storage

```typescript
import { storage, storageKey } from '@cat-kit/fe'

const TOKEN = storageKey<string>('token')

storage.local.set(TOKEN, 'abc', 3600)    // 设置 + 过期秒数
storage.local.get(TOKEN)                  // string | null
storage.local.get(TOKEN, 'default')      // 带默认值
storage.local.get([TOKEN, USER])         // 批量获取
storage.local.getExpire(TOKEN)            // 过期时间戳
storage.local.remove(TOKEN)
storage.local.on('token', (key, value, temp) => {})

storage.session.set(TOKEN, 'abc')         // sessionStorage
```

## Cookie

```typescript
import { cookie } from '@cat-kit/fe'

cookie.set('key', 'value', {
  expires?: number | Date, path?, domain?, secure?, sameSite?
})
cookie.get('key')
cookie.has('key')
cookie.remove('key', { domain?, path? })
cookie.getAll()
cookie.clear()
```
