# @cat-kit/be

Node.js 专用工具包，提供文件系统、日志、缓存、配置、网络、系统信息等后端通用工具。

## 运行环境

仅 Node.js（依赖 `node:` 内置模块）。

## API 分类

| 分类 | 文档 | 说明 |
|------|------|------|
| 文件系统 | [fs.md](fs.md) | 目录遍历/创建/删除、文件读写 |
| 日志系统 | [logger.md](logger.md) | Logger 日志器、ConsoleTransport 等 |
| 缓存 | [cache.md](cache.md) | LRU 缓存、TTL 缓存等 |
| 配置管理 | [config.md](config.md) | env 变量、配置文件读取 |
| 网络工具 | [net.md](net.md) | IP 地址、可用端口等 |
| 系统信息 | [system.md](system.md) | CPU、内存、磁盘等信息 |
| 调度器 | [scheduler.md](scheduler.md) | 定时任务、cron 等 |

## 类型签名

> 详见 `../../generated/be/index.d.ts`
