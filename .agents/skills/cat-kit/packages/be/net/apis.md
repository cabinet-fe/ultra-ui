# 网络 — API

```ts
declare function isPortAvailable(
  port: number,
  options?: { host?: string; timeout?: number }
): Promise<boolean>

declare function getLocalIP(options?: {
  family?: 4 | 6
  includeInternal?: boolean
}): string | undefined
```
