# be — 系统监控

```typescript
import {
  getCPUUsage, getMemoryUsage, getDiskUsage,
  getSystemInfo, getProcessInfo, monitorSystem
} from '@cat-kit/be'

await getCPUUsage()    // { usage, cores, model }
getMemoryUsage()       // { total, used, free, percentage }
await getDiskUsage()   // [{ total, used, free, percentage, mount }]
getSystemInfo()        // { platform, arch, hostname, uptime, ... }
getProcessInfo()       // { pid, memory, cpu, uptime }

const stop = monitorSystem({ interval: 5000, onData: (data) => {} })
stop()
```
