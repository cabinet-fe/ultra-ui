# be — config

配置管理：环境变量加载/校验、配置文件加载（JSON/YAML/TOML）。

## loadEnv

```ts
function loadEnv(options?: LoadEnvOptions): Promise<EnvRecord>
```

按顺序加载 `.env` 系列文件，后面覆盖前面：
1. `.env`
2. `.env.local`
3. `.env.${mode}`
4. `.env.${mode}.local`

```ts
interface LoadEnvOptions {
  cwd?: string             // 工作目录，默认 process.cwd()
  mode?: string            // 环境模式（如 'production'）
  files?: string[]         // 自定义文件列表（覆盖默认顺序）
  override?: boolean       // 是否覆盖已有 process.env，默认 true
  injectToProcess?: boolean // 是否注入 process.env，默认 true
}
```

```ts
import { loadEnv } from '@cat-kit/be'

// 加载 .env.development 系列
await loadEnv({ mode: 'development' })

// 仅返回对象，不注入 process.env
const env = await loadEnv({ injectToProcess: false })
```

## parseEnv

```ts
function parseEnv<T>(schema: EnvSchema<T>, source?: Record<string, string | undefined>): T
```

按 schema 校验和转换环境变量，类型安全。

```ts
interface EnvDefinition<T> {
  type?: 'string' | 'number' | 'boolean' | 'json' | 'array' | ((v: string) => T)
  default?: T
  required?: boolean
  delimiter?: string     // array 类型分隔符，默认 ','
  transform?: (value: T) => T  // 后处理
}
```

类型转换规则：
- `string`：原值
- `number`：`Number()`，NaN 抛错
- `boolean`：`'true'`、`'1'`、`'yes'`、`'on'` 为 true
- `json`：`JSON.parse()`
- `array`：按 delimiter 分割

```ts
import { parseEnv } from '@cat-kit/be'

const config = parseEnv({
  PORT: { type: 'number', default: 3000 },
  HOST: { type: 'string', default: '0.0.0.0' },
  DEBUG: { type: 'boolean', default: false },
  ALLOWED_ORIGINS: { type: 'array', default: ['*'] },
  REDIS_URL: { type: 'string', required: true },
})

// config: { PORT: number; HOST: string; DEBUG: boolean; ALLOWED_ORIGINS: string[]; REDIS_URL: string }
```

## loadConfig

```ts
function loadConfig<T>(filePath: string, options?: LoadConfigOptions<T>): Promise<T>

interface LoadConfigOptions<T> {
  cwd?: string             // 默认 process.cwd()
  format?: 'json' | 'yaml' | 'toml'  // 默认按扩展名推断
  defaults?: Partial<T>    // 默认值（与解析结果深度合并）
  parser?: (content: string) => T  // 自定义解析器
  validate?: (data: unknown) => data is T  // 自定义校验
  mergeDefaults?: boolean  // 是否合并 defaults，默认 true
}
```

支持格式：
- JSON（内置）
- YAML（需安装 `js-yaml`）
- TOML（需安装 `smol-toml`）

缺少对应 peer dependency 时抛出 `PeerDependencyError`。

```ts
import { loadConfig } from '@cat-kit/be'

const config = await loadConfig<AppConfig>('./config/app.yml', {
  defaults: { port: 3000, logLevel: 'info' }
})
```

## mergeConfig

```ts
function mergeConfig<T>(...configs: Array<Partial<T>>): T
```

深度合并多个配置对象。数组直接替换，对象递归合并。不修改原始对象。

```ts
import { mergeConfig } from '@cat-kit/be'

const defaults = { host: '0.0.0.0', port: 3000, redis: { url: 'localhost' } }
const overrides = { port: 8080, redis: { password: 'secret' } }

const config = mergeConfig(defaults, overrides)
// { host: '0.0.0.0', port: 8080, redis: { url: 'localhost', password: 'secret' } }
```

> 类型签名：`../../generated/be/config/`
