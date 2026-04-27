# core — env

运行时环境检测工具，可在浏览器和 Node.js 中跨平台使用。

## 运行时检测

### `getRuntime`

```ts
function getRuntime(): 'browser' | 'node' | 'unknown'
```

探测当前运行时环境。先检测 `window` 再检测 `process`。

### `isInBrowser` / `isInNode`

```ts
function isInBrowser(): boolean
function isInNode(): boolean
```

运行时布尔判断。

## 操作系统

### `getOSType`

```ts
function getOSType(): OSType
// 'Windows' | 'Linux' | 'MacOS' | 'Android' | 'iOS' | 'Unknown'
```

浏览器通过 `navigator.userAgent`，Node.js 通过 `process.platform` 探测。

## 设备

### `getDeviceType` / `isMobile` / `isTablet` / `isDesktop`

```ts
function getDeviceType(): DeviceType // 'Mobile' | 'Desktop' | 'Tablet' | 'Unknown'
function isMobile(): boolean
function isTablet(): boolean
function isDesktop(): boolean
```

### `isTouchDevice`

```ts
function isTouchDevice(): boolean
```

检测是否为触摸设备。

## 浏览器

### `getBrowserType` / `getBrowserVersion`

```ts
function getBrowserType(): BrowserType
// 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'IE' | 'Opera' | 'Unknown'

function getBrowserVersion(): string | null
```

通过 UA 探测浏览器类型和版本。仅在浏览器环境下有效，Node.js 下均返回 `'Unknown'` / `null`。

## Node.js

### `getNodeVersion`

```ts
function getNodeVersion(): string | null
```

获取 Node.js 版本号（不含 `v` 前缀），非 Node 环境返回 `null`。

## 综合信息

### `getEnvironmentSummary`

```ts
function getEnvironmentSummary(): EnvironmentSummary
```

返回结构化的环境信息：

```ts
interface EnvironmentSummary {
  os: OSType
  // 浏览器环境额外有：
  browser?: BrowserType
  browserVersion?: string | null
  device?: DeviceType
  touchSupported?: boolean
  // Node 环境额外有：
  nodeVersion?: string | null
}
```

```ts
import { getEnvironmentSummary } from '@cat-kit/core'

const env = getEnvironmentSummary()
// 浏览器: { os: 'MacOS', browser: 'Chrome', device: 'Desktop', ... }
// Node:   { os: 'MacOS', nodeVersion: '22.12.0' }
```

> 类型签名：`../../generated/core/env/env.d.ts`
