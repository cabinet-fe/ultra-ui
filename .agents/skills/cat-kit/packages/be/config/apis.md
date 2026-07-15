# 配置 — API

```ts
declare function parseEnvFile(content: string): EnvRecord
declare function loadEnv(options?: LoadEnvOptions): Promise<Record<string, string>>
declare function parseEnv<T extends EnvSchema>(
  schema: T,
  source?: Record<string, string | undefined>
): { [K in keyof T]: /* 按 schema 推断 */ }

declare function loadConfig<T = unknown>(
  file: string,
  options?: LoadConfigOptions
): Promise<T>
declare function mergeConfig<T extends Record<string, any>>(
  ...configs: Array<Partial<T> | undefined>
): T
```

`EnvDefinition` 支持 `type`、`default`、`required` 等，见 generated。
