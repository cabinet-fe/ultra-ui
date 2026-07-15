# http — 客户端

## 何时使用

创建可复用的 HTTP 客户端：前缀、origin、超时、引擎、子客户端、中断与错误处理。

## 推荐公开 API

- `HTTPClient`、`mergeRequestConfig`、`HTTPError`
- 引擎：`HttpEngine`、`FetchEngine`、`XHREngine`
- 类型：`ClientConfig`、`RequestConfig`、`HTTPResponse`、`HTTPClientPlugin` 等

详情见 [apis.md](apis.md)、[examples.md](examples.md)。插件见 [plugins](../plugins/index.md)。

## 约束

- 默认：有全局 `fetch` 用 `FetchEngine`，否则 `XHREngine`；Node 皆无时需自定义引擎
- 绝对 URL 跳过 `prefix`/`origin`；相对 URL 使用二者
- `query` 走 `URLSearchParams`（与 core `obj2query` 不同）
- 对象/数组 body → JSON；`FormData` 不设 Content-Type；GET/HEAD 无 body；假值 body（含 `''`）被引擎省略
- 非 2xx → `HTTPError`（`code: 'NETWORK'`）并带解析后的 `response`
- `FetchEngine` 忽略 `onUploadProgress`
- XSRF Cookie→Header 仅浏览器同域
- `group()` 共享引擎，任一方 `abort()` 影响该引擎上所有请求；父插件先于子插件

## 类型入口

[client.d.ts](../../../generated/http/client.d.ts) · [types.d.ts](../../../generated/http/types.d.ts)
