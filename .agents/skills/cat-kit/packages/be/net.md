# be — net

网络工具：端口检测和本地 IP 获取。

## isPortAvailable

```ts
function isPortAvailable(port: number, options?: PortCheckOptions): Promise<boolean>

interface PortCheckOptions {
  host?: string    // 默认 '127.0.0.1'
  timeout?: number // 超时（ms），默认 1000
}
```

尝试在指定端口创建 TCP 服务器来判断端口是否被占用。超时返回 `false`。

```ts
import { isPortAvailable } from '@cat-kit/be'

const port = 3000
if (await isPortAvailable(port)) {
  app.listen(port)
} else {
  console.error(`Port ${port} is in use`)
}
```

## getLocalIP

```ts
function getLocalIP(options?: GetLocalIPOptions): string | undefined

interface GetLocalIPOptions {
  family?: 'IPv4' | 'IPv6'    // 默认 'IPv4'
  includeInternal?: boolean   // 是否包含内部接口，默认 false
}
```

遍历 `os.networkInterfaces()` 返回首个匹配的 IP 地址。

```ts
import { getLocalIP } from '@cat-kit/be'

const ip = getLocalIP()                    // '192.168.1.100'
const ip6 = getLocalIP({ family: 'IPv6' }) // 'fe80::...'
```

> 类型签名：`../../generated/be/net/`
