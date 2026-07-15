# be — 系统信息

## 何时使用

读取 CPU、内存、磁盘、网卡快照。

## 推荐公开 API

`getCpuInfo`、`getCpuUsage`、`getMemoryInfo`、`getDiskInfo`、`getNetworkInterfaces`

```ts
import { getCpuUsage, getMemoryInfo } from '@cat-kit/be'

await getCpuUsage(200)
getMemoryInfo().usedPercent
```

详情见 [apis.md](apis.md)。

## 约束

`getCpuUsage` / `getDiskInfo` 为异步；其余多为同步。

## 类型入口

[generated/be/system/](../../../generated/be/system/)
