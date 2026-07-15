# 系统信息 — API

```ts
declare function getCpuInfo(): CpuInfo
declare function getCpuUsage(interval?: number): Promise<CpuUsage>
declare function getMemoryInfo(): MemoryInfo
declare function getDiskInfo(path?: string): Promise<DiskInfo>
declare function getNetworkInterfaces(
  options?: GetNetworkInterfacesOptions
): NetworkInterfaceInfo[]
```

结构体字段见 generated 对应 `.d.ts`。
