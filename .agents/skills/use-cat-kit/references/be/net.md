# be — 网络工具

```typescript
import {
  isPortAvailable, findAvailablePort,
  getLocalIP, getPublicIP,
  httpGet, httpPost, downloadFile, ping
} from '@cat-kit/be'

await isPortAvailable(3000)
await findAvailablePort(3000, 4000)
getLocalIP()
await getPublicIP()
await httpGet(url, options?)
await httpPost(url, body, options?)
await downloadFile(url, dest, { onProgress? })
await ping(host, { timeout? })  // { alive, time }
```
