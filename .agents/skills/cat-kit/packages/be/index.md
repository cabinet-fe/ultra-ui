# @cat-kit/be

仅用于 Node.js（及兼容 `node:` 的 Bun）。所有 API 从 `@cat-kit/be` 包根导入。

**版本**：1.1.8  
**导入**：`import { ... } from '@cat-kit/be'`

## 主题

| 主题 | 说明 |
| --- | --- |
| [fs](fs/index.md) | 遍历、读写、移动、清理 |
| [config](config/index.md) | `.env`、环境变量校验、配置加载合并 |
| [cache](cache/index.md) | LRU、文件缓存、memoize |
| [logger](logger/index.md) | 控制台 / 文件日志 |
| [net](net/index.md) | 端口可用性、本机地址 |
| [scheduler](scheduler/index.md) | Cron、延迟、周期任务 |
| [system](system/index.md) | CPU、内存、磁盘、网卡 |
| [组合示例](examples.md) | 跨主题组合 |

不要在浏览器代码中使用。精确签名见各主题 `apis.md` 与 [generated/be/index.d.ts](../../generated/be/index.d.ts)。
