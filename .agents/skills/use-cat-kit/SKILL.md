---
name: use-cat-kit
description: >
  cat-kit monorepo 各包的 API 文档与使用指南。当需要使用 @cat-kit/* 包编写代码、查找可用 API、
  了解包的功能或查阅用法示例时使用此技能。覆盖包：core（类型判断、对象/数组/字符串/数字操作、
  日期、环境检测、性能优化、观察者模式、数据结构）、http（HTTPClient、插件系统）、
  fe（存储、文件、剪贴板、虚拟滚动）、be（文件系统、配置、日志、缓存、网络、系统、调度器）、
  excel（工作簿模型、读写、流式解析）、maintenance（monorepo管理、依赖分析、版本、构建、发布）、
  agent-context（ac-workflow CLI 与 Skill）、cli（提交信息校验）。
---

# use-cat-kit

cat-kit 各包的 API 参考。按需读取对应 reference 文件，不要一次全部加载。

## 导入约定

```typescript
// tests、docs 包内用 /src 路径
import { o, date } from '@cat-kit/<pkg>/src'
// 其他包用构建产物
import { o, date } from '@cat-kit/core'
```

## @cat-kit/core — 通用工具（零依赖）

| 模块 | 关键 API | 文件 |
|---|---|---|
| 数据处理 | `o()` `arr()` `str()` `n()` 类型判断 转换函数 | [core/data.md](references/core/data.md) |
| 日期 | `date()` `Dater` 格式化/解析/比较/计算 | [core/date.md](references/core/date.md) |
| 环境检测 | `getRuntime` `getOSType` `getBrowserType` | [core/env.md](references/core/env.md) |
| 性能优化 | `debounce` `throttle` `parallel` `sleep` `safeRun` | [core/optimize.md](references/core/optimize.md) |
| 观察者 | `Observable` | [core/pattern.md](references/core/pattern.md) |
| 数据结构 | `dfs` `TreeManager` `Forest` | [core/data-structure.md](references/core/data-structure.md) |

## @cat-kit/http — HTTP 客户端（Browser）

| 模块 | 关键 API | 文件 |
|---|---|---|
| 客户端 | `HTTPClient` get/post/put/delete/patch group abort | [http/client.md](references/http/client.md) |
| 插件 | `TokenPlugin` `MethodOverridePlugin` 自定义插件 | [http/plugins.md](references/http/plugins.md) |

## @cat-kit/fe — 前端工具（Browser）

| 模块 | 关键 API | 文件 |
|---|---|---|
| 存储 | `storage` `storageKey` `cookie` | [fe/storage.md](references/fe/storage.md) |
| 文件 | `readChunks` `saveBlob` | [fe/file.md](references/fe/file.md) |
| Web API | `clipboard` `queryPermission` | [fe/web-api.md](references/fe/web-api.md) |
| 虚拟滚动 | `Virtualizer` `VirtualContainer` | [fe/virtualizer.md](references/fe/virtualizer.md) |

## @cat-kit/be — 后端工具（Node.js/Bun）

| 模块 | 关键 API | 文件 |
|---|---|---|
| 文件系统 | `readDirRecursive` `readFile` `writeFile` `watchFile` | [be/fs.md](references/be/fs.md) |
| 配置 | `readConfig` `ConfigManager` YAML/TOML/JSON | [be/config.md](references/be/config.md) |
| 日志 | `createLogger` debug/info/warn/error | [be/logger.md](references/be/logger.md) |
| 缓存 | `LRUCache` | [be/cache.md](references/be/cache.md) |
| 网络 | `isPortAvailable` `ping` `downloadFile` | [be/net.md](references/be/net.md) |
| 系统 | `getCPUUsage` `getMemoryUsage` `monitorSystem` | [be/system.md](references/be/system.md) |
| 调度 | `Scheduler` `CronExpression` | [be/scheduler.md](references/be/scheduler.md) |

## @cat-kit/excel — Excel 读写（通用）

| 模块 | 关键 API | 文件 |
|---|---|---|
| 模型 | `Workbook` `Worksheet` `Row` `Cell` | [excel/model.md](references/excel/model.md) |
| 读写 | `readWorkbook` `readWorkbookStream` `writeWorkbook` | [excel/io.md](references/excel/io.md) |
| 工具 | `columnToIndex` `dateToExcelSerial` 错误类型 | [excel/tools.md](references/excel/tools.md) |

## @cat-kit/maintenance — Monorepo 维护（Node.js）

| 模块 | 关键 API | 文件 |
|---|---|---|
| Monorepo | `Monorepo` `WorkspaceGroup` `buildLib` | [maintenance/monorepo.md](references/maintenance/monorepo.md) |
| 依赖分析 | `checkCircularDependencies` `buildDependencyGraph` | [maintenance/deps.md](references/maintenance/deps.md) |
| 版本 | `parseSemver` `incrementVersion` `bumpVersion` | [maintenance/version.md](references/maintenance/version.md) |
| 发布 | `createGitTag` `commitAndPush` `publishPackage` | [maintenance/release.md](references/maintenance/release.md) |

## @cat-kit/agent-context — ac-workflow（Node.js CLI）

→ [agent-context.md](references/agent-context.md) — 生命周期、CLI、Action、协作场景

## @cat-kit/cli — 命令行工具（Node.js）

→ [cli.md](references/cli.md) — `cat-cli verify-commit` 提交信息校验
