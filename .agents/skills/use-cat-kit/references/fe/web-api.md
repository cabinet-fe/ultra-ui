# fe — 剪贴板与权限

## clipboard

```typescript
import { clipboard } from '@cat-kit/fe'

await clipboard.copy('text')
await clipboard.copy(blob)
await clipboard.copy([text, imageBlob])
const text = await clipboard.readText()
const blobs = await clipboard.read()
```

要求 HTTPS 或 localhost，部分浏览器需用户手势触发。

## queryPermission

```typescript
import { queryPermission } from '@cat-kit/fe'

await queryPermission('clipboard-read')    // boolean
await queryPermission('clipboard-write')
await queryPermission('notifications')
await queryPermission('geolocation')
// 'persistent-storage' | 'push' | 'screen-wake-lock' | 'xr-spatial-tracking'
```
