# core — 环境检测

## 何时使用

探测运行时、操作系统、浏览器、设备类型或汇总环境信息。

## 推荐公开 API

`getRuntime`、`isInBrowser`、`isInNode`、`getOSType`、`getDeviceType`、`getBrowserType`、`getBrowserVersion`、`isMobile`、`isTablet`、`isDesktop`、`isTouchDevice`、`getNodeVersion`、`getEnvironmentSummary`

```ts
import { getEnvironmentSummary, getRuntime } from '@cat-kit/core'

getRuntime() // 'browser' | 'node' | 'unknown'
getEnvironmentSummary()
```

详情见 [apis.md](apis.md)。

## 约束

- `getRuntime`：先看 `globalThis.window`，再看 `process`；Electron 等同时存在时为 `browser`
- 浏览器/设备相关 API 在非浏览器环境可能返回 `Unknown` 或受限结果

## 类型入口

[env.d.ts](../../../generated/core/env/env.d.ts)
