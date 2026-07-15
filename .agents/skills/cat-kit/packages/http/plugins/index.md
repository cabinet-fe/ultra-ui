# http — 插件

## 何时使用

Token 注入/刷新、方法覆盖，或实现自定义 `HTTPClientPlugin`。

## 推荐公开 API

- `TokenPlugin`（别名 `HTTPTokenPlugin`）
- `MethodOverridePlugin`（别名 `HTTPMethodOverridePlugin`）
- 插件钩子类型：`HTTPClientPlugin`、`PluginHookResult`、`ClientPlugin`

详情见 [apis.md](apis.md)、[examples.md](examples.md)。

## 约束

- `registerPlugin`：`name` 非空且在父子链唯一，否则 `HTTPError`（`PLUGIN`）
- `TokenPlugin` 固定 `name: 'token'`，整条继承链只能有一个
- `getter` 返回 `null`/`undefined`/`''` 不注入 Header；并发刷新共享同一 Promise
- `shouldRefresh` 仅在提供 `onRefresh` 时重试；默认 `maxRetries: 2`
- 不要在示例中使用 `_retryAttempt`（`@internal`）
- `MethodOverridePlugin` 默认把 `DELETE`/`PUT`/`PATCH` 改为 `POST`，原方法写入 `X-HTTP-Method-Override`
- 钩子签名为单上下文对象：`beforeRequest({ url, config })`，不是 `(url, config)`

## 类型入口

[token.d.ts](../../../generated/http/plugins/token.d.ts) · [method-override.d.ts](../../../generated/http/plugins/method-override.d.ts)
