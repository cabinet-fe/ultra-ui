# @cat-kit/http

可用于浏览器与 Node.js 的 HTTP 客户端：统一 URL、配置、响应与错误，支持可替换引擎与请求插件。

**版本**：1.1.8  
**导入**：`import { ... } from '@cat-kit/http'`（仅包根）

## 适用场景

- 复用 `origin`、路径前缀、请求头、超时与响应类型
- 类型化响应、请求取消、传输进度或同域 XSRF Header
- 按业务域创建子客户端，或注入自定义传输引擎
- Token 注入/刷新、HTTP 方法覆盖或自定义插件

仅需一次简单请求且原生 `fetch` 已足够时，不必引入本包。

## 主题

| 主题 | 说明 |
| --- | --- |
| [client](client/index.md) | 创建客户端、请求、响应/错误、引擎、配置合并 |
| [plugins](plugins/index.md) | Token、方法覆盖、自定义插件 |
| [组合示例](examples.md) | 客户端 + 插件组合 |

## 类型入口

[generated/http/index.d.ts](../../generated/http/index.d.ts)
