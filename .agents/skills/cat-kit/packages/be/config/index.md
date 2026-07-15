# be — 配置

## 何时使用

解析 `.env`、校验环境变量、加载 JSON/YAML/TOML/JS 配置并合并。

## 推荐公开 API

`parseEnvFile`、`loadEnv`、`parseEnv`、`loadConfig`、`mergeConfig`

详情见 [apis.md](apis.md)、[examples.md](examples.md)。

## 约束

- `loadEnv`：缺文件忽略；后文件覆盖返回记录；`override: false` 时不覆盖已有 `process.env`
- `required: true` 在原始值为空时失败，即使有 default
- `loadConfig` 动态导入 YAML/TOML 解析器（包已依赖 `js-yaml`、`smol-toml`）
- `mergeConfig` 深合并普通对象、数组整体替换、不修改入参

## 类型入口

[env.d.ts](../../../generated/be/config/env.d.ts) · [config.d.ts](../../../generated/be/config/config.d.ts) · [merge.d.ts](../../../generated/be/config/merge.d.ts)
