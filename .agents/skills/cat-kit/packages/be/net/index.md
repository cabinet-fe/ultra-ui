# be — 网络

## 何时使用

探测端口是否可绑定，或获取本机网卡地址。

## 推荐公开 API

`isPortAvailable`、`getLocalIP`

```ts
import { getLocalIP, isPortAvailable } from '@cat-kit/be'

if (!(await isPortAvailable(3000))) throw new Error('port busy')
getLocalIP({ includeInternal: false })
```

详情见 [apis.md](apis.md)。

## 约束

- 端口探测为 bind-and-close，存在竞态，不是预留
- `includeInternal: false` 排除 Node `address.internal`（通常 loopback），**不是**公网 IP，也不排除 RFC1918 局域网地址

## 类型入口

[port.d.ts](../../../generated/be/net/port.d.ts) · [ip.d.ts](../../../generated/be/net/ip.d.ts)
