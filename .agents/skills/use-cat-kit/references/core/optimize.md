# core — 性能优化

## parallel

```typescript
import { parallel } from '@cat-kit/core'

const results = await parallel([
  () => fetch('/api/users'),
  () => fetch('/api/posts')
])
```

## debounce

```typescript
import { debounce } from '@cat-kit/core'

const fn = debounce((data) => save(data), 500, immediate?)
```

## throttle

```typescript
import { throttle } from '@cat-kit/core'

const fn = throttle(() => update(), 100, cb?)
// cb 可接收返回值
```

## sleep

```typescript
import { sleep } from '@cat-kit/core'
await sleep(1000)
```

## safeRun

包装同步逻辑，避免 try/catch。

```typescript
import { safeRun } from '@cat-kit/core'

safeRun(() => JSON.parse(str))           // 失败返回 undefined
safeRun(() => JSON.parse(str), defaults) // 失败返回 defaults
```
