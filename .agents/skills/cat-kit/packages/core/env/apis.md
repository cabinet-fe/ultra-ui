# 环境检测 — API

```ts
declare function getRuntime(): 'browser' | 'node' | 'unknown'
declare function isInBrowser(): boolean
declare function isInNode(): boolean
declare function getOSType(): OSType
declare function getDeviceType(): DeviceType
declare function getBrowserType(): BrowserType
declare function getBrowserVersion(): string
declare function isMobile(): boolean
declare function isTablet(): boolean
declare function isDesktop(): boolean
declare function isTouchDevice(): boolean
declare function getNodeVersion(): string | undefined
declare function getEnvironmentSummary(): EnvironmentSummary

type OSType = 'Windows' | 'Linux' | 'MacOS' | 'Android' | 'iOS' | 'Unknown'
type DeviceType = 'Mobile' | 'Desktop' | 'Tablet' | 'Unknown'
type BrowserType =
  | 'Chrome'
  | 'Firefox'
  | 'Safari'
  | 'Edge'
  | 'IE'
  | 'Opera'
  | 'Unknown'
```

`EnvironmentSummary` 字段见 [env.d.ts](../../../generated/core/env/env.d.ts)。
