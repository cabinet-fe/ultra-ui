# 完整范例：API 参考

一篇写满的 API 参考文档，路径 `agent-docs/apis/request.md`，169 行。首次撰写任何类型的文档前读一次，对照自己的产出。示范点：

- `keywords` 同时含标识符（`skipErrorHandler`）、场景词（`静默请求`）与报错片段（`Token Expired`）
- `## 快速上手` 把初始化前提 `initAuthBridge()` 写全，而不是只给一行调用
- `## 典型示例` 三个示例各自重复 `import`，任一章节被单独取回都能运行
- `## 方法与事件` 写清返回、异步与每种错误的触发条件
- `## 注意事项` 逐条「本库是 X，不是 Y」
- `## 常见问题` 报错原文照抄并给修复代码

骨架见 [templates/api-reference.md](templates/api-reference.md)，规范见 [doc-standards.md](doc-standards.md)。

````markdown
---
title: request HTTP 请求客户端
description: 基于 Axios 封装的统一 HTTP 客户端：自动附带网关鉴权头，401 时刷新 token 并重放一次，按配置重试，业务码非 0 时抛出 BusinessError 并弹全局提示。
aliases: [httpClient, axios 封装, 网络请求]
keywords: [initAuthBridge, skipErrorHandler, retryTimes, BusinessError, 401, Token Expired, token 刷新, 统一错误处理, 静默请求, 取消请求, 重试]
---

# request HTTP 请求客户端

`@company/request` 导出单例 `request`、初始化函数 `initAuthBridge` 与错误类 `BusinessError`。所有请求自动附带网关鉴权头；HTTP 401 时刷新 token 并重放一次；接口返回 `code !== 0` 时抛出 `BusinessError` 并弹全局错误提示。

## 快速上手

应用入口执行一次初始化，之后任意文件直接调用：

```ts
// src/main.ts
import { initAuthBridge } from '@company/request';

initAuthBridge({ ssoOrigin: 'https://sso.company.com' });
```

```ts
// src/api/user.ts
import { request } from '@company/request';

interface UserInfo {
  id: string;
  name: string;
}

// 返回值已解包为接口的 data 字段，不是 AxiosResponse
const user = await request.get<UserInfo>('/api/v1/user/profile');
console.log(user.name); // => 'Alice'
```

## API 签名

```ts
import type { AxiosRequestConfig } from 'axios';

export interface AuthBridgeOptions {
  /** SSO 服务源，用于 401 时刷新 token。必填 */
  ssoOrigin: string;
}

/** 绑定 SSO，必须在任何请求之前调用一次；重复调用抛出 Error('initAuthBridge called twice') */
export function initAuthBridge(options: AuthBridgeOptions): void;

export interface RequestConfig extends AxiosRequestConfig {
  /** 为 true 时业务错误不弹全局提示，仅抛出 BusinessError。默认 false */
  skipErrorHandler?: boolean;
  /** 网络超时或 502/503 时的自动重试次数，取值 0~3，仅 GET 生效。默认 0 */
  retryTimes?: number;
}

export interface HttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
}

export class BusinessError extends Error {
  /** 接口返回的业务码，非 0 */
  readonly code: number;
  /** 接口返回的原始 data */
  readonly data: unknown;
}

export const request: HttpClient;
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `ssoOrigin` | `string` | — | 是 | 完整 origin（含协议），不带路径 |
| `skipErrorHandler` | `boolean` | `false` | 否 | 只影响 `BusinessError`；HTTP 层错误（超时、5xx）始终抛出且不弹提示 |
| `retryTimes` | `number` | `0` | 否 | 取值 0~3，超出按 3；仅 GET 生效，POST / PUT / DELETE 忽略 |
| `timeout` | `number` | `10000` | 否 | 毫秒；继承 Axios，本库默认值改为 10000 |

## 方法与事件

`request.get` / `post` / `put` / `delete` 均为异步，返回 `Promise<T>`，`T` 是接口 `data` 字段的类型：

- 接口 `code === 0`：resolve 为 `data`
- 接口 `code !== 0`：抛出 `BusinessError`；未设 `skipErrorHandler` 时同时弹全局提示
- HTTP 401：刷新 token 后重放一次；仍 401 则抛出 `BusinessError`（`code` 为 401）
- 网络错误、超时、5xx：抛出 Axios 的 `AxiosError`，不弹提示

## 典型示例

### 静默提交并按业务码分流

```ts
import { request, BusinessError } from '@company/request';

interface SubmitResult {
  orderId: string;
}

try {
  const result = await request.post<SubmitResult>(
    '/api/v1/order/submit',
    { skuId: 'sku_1', count: 2 },
    { skipErrorHandler: true }, // 不弹默认提示，自行处理业务码
  );
  console.log(result.orderId); // => 'ord_9f3a'
} catch (err) {
  if (err instanceof BusinessError && err.code === 10042) {
    // 库存不足：跳转补货页
  } else {
    throw err; // 其他错误交给上层
  }
}
```

### 弱网重试

```ts
import { request } from '@company/request';

// 只对 GET 生效；超时 3 秒，最多重试 3 次
const regions = await request.get<string[]>('/api/v1/regions', {
  retryTimes: 3,
  timeout: 3000,
});
console.log(regions.length); // => 34
```

### 取消请求

```ts
import { request } from '@company/request';

const controller = new AbortController();
const pending = request.get<string[]>('/api/v1/search', {
  params: { q: 'table' },
  signal: controller.signal,
});
controller.abort(); // pending 以 Axios CanceledError reject，不弹全局提示
```

## 注意事项

> [!WARNING]
> - 返回值是接口 `data` 字段，不是 `AxiosResponse`；禁止写 `res.data.data`。
> - 业务错误类是 `BusinessError`，不是 Axios 的 `AxiosError`；用 `instanceof BusinessError` 判断。
> - 单例 `request` 已带鉴权配置；禁止用 `axios.create()` 自建实例，否则请求不带鉴权头。
> - `retryTimes` 对 POST / PUT / DELETE 无效，防止重复提交。
> - v2.0 起移除 `request.setToken()`，token 由 SSO 注入；调用会抛 `TypeError: request.setToken is not a function`。

## 常见问题

### 报错 `BusinessError: code=401 Token Expired` 且没有自动刷新

原因：应用入口未调用 `initAuthBridge()`，客户端拿不到刷新凭证。修复：

```ts
// src/main.ts，任何请求之前
import { initAuthBridge } from '@company/request';

initAuthBridge({ ssoOrigin: 'https://sso.company.com' });
```

### 报错 `Error: initAuthBridge called twice`

原因：入口与业务文件都调用了 `initAuthBridge()`。修复：只保留入口一处调用，业务文件删除该行。
````
