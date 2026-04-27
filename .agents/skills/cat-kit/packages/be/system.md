# be — system

系统信息获取：CPU、内存、磁盘、网络接口。

## CPU

### `getCpuInfo`

```ts
function getCpuInfo(): CpuInfo

interface CpuInfo {
  model: string
  cores: number
  speed: number                           // MHz
  loadAverage: [number, number, number]   // 1/5/15 分钟负载
}
```

```ts
import { getCpuInfo } from '@cat-kit/be'

const cpu = getCpuInfo()
// { model: 'Apple M5', cores: 8, speed: 3500, loadAverage: [1.5, 1.2, 1.1] }
```

### `getCpuUsage`

```ts
function getCpuUsage(interval?: number): Promise<CpuUsage>

interface CpuUsage {
  user: number
  system: number
  idle: number
  total: number
  percent: number   // 使用率百分比
}
```

采样指定 interval（ms，默认 500）内的 CPU 使用情况。

```ts
const usage = await getCpuUsage(1000)
console.log(`CPU: ${usage.percent}%`)
```

## Memory

```ts
function getMemoryInfo(): MemoryInfo

interface MemoryInfo {
  total: number
  free: number
  used: number
  usedPercent: number
}
```

```ts
import { getMemoryInfo } from '@cat-kit/be'

const mem = getMemoryInfo()
console.log(`Memory: ${(mem.used / 1024 / 1024 / 1024).toFixed(1)} GB / ${(mem.total / 1024 / 1024 / 1024).toFixed(1)} GB`)
```

## Disk

```ts
function getDiskInfo(path?: string): Promise<DiskInfo>

interface DiskInfo {
  path: string
  total: number
  free: number
  used: number
  usedPercent: number
}
```

获取指定路径所在磁盘容量信息。默认 `process.cwd()`。Windows 用 PowerShell，Unix 用 `statfs`。

```ts
import { getDiskInfo } from '@cat-kit/be'

const disk = await getDiskInfo('/var/data')
console.log(`Disk: ${disk.usedPercent}% full`)
```

## Network

```ts
function getNetworkInterfaces(options?: GetNetworkInterfacesOptions): NetworkInterfaceInfo[]

interface NetworkInterfaceInfo {
  name: string
  address: string
  family: string
  mac: string
  internal: boolean
  netmask: string
  cidr?: string | null
}
```

获取本机所有网络接口信息。`includeInternal` 默认 `false`。

```ts
import { getNetworkInterfaces } from '@cat-kit/be'

const interfaces = getNetworkInterfaces()
interfaces.forEach(iface => {
  if (!iface.internal) {
    console.log(`${iface.name}: ${iface.address}/${iface.cidr}`)
  }
})
```

> 类型签名：`../../generated/be/system/`
