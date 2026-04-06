# core — 环境检测

```typescript
import {
  getRuntime, isInBrowser, isInNode,
  getOSType, getDeviceType,
  getBrowserType, getBrowserVersion
} from '@cat-kit/core'

getRuntime()         // 'browser' | 'node' | 'unknown'
isInBrowser()        // boolean
isInNode()           // boolean
getOSType()          // 'Windows' | 'MacOS' | 'Linux' | 'iOS' | 'Android' | 'Unknown'
getDeviceType()      // 'Mobile' | 'Desktop' | 'Unknown'
getBrowserType()     // 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'IE' | 'Opera' | 'Unknown'
getBrowserVersion()  // '120.0.6099.109'
```

Bun 运行时被识别为 `'node'`。浏览器检测基于 User-Agent。
