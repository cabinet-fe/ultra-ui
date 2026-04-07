---
name: use-cat-kit
description: >
  Cat-kit @cat-kit/* API typings mirrored under skills/use-cat-kit/generated from package dist (npm-aligned).
  Use when coding against @cat-kit/core, http, fe, be, excel, maintenance, or agent-context / cat-cli CLIs.
  Read generated/<pkg>/index.d.ts and related .d.ts; run bun run sync-use-cat-kit-api from repo root to refresh.
---

# use-cat-kit

## 权威 API（与 npm typings 一致）

各包 **`dist` 生成的 `.d.ts`** 镜像在：

**`skills/use-cat-kit/generated/<包目录名>/`**

例如：`generated/core/index.d.ts`、`generated/http/index.d.ts`。  
元数据与版本见 **`generated/manifest.json`**，说明见 **`generated/README.md`**。

**刷新**：在仓库根执行

- `bun run sync-use-cat-kit-api` — 仅复制（需已构建各包 `dist`）
- `bun run sync-use-cat-kit-api:build` — 先 `buildLib`（tsdown）+ `tsc`（agent-context、cli），再复制

脚本路径：`skills/use-cat-kit/scripts/sync-api-from-dist.ts`

## 心智模型

1. **公共 API**：以各包根导出的类型为准，从 **`generated/<pkg>/index.d.ts`** 起顺着 `import` / 同目录 `.d.ts` 阅读（`preserveModules` 产物与源码结构大致对应）。
2. **查证顺序**：`generated/**/*.d.ts` → 需要实现细节时再看 `packages/<pkg>/src`。
3. **环境**：`core` / `http` / `excel` / `maintenance` 偏通用；`fe` 为 browser；`be` 为 node；`agent-context` / `cli` 以 CLI 为主。

## 本仓库内导入（与根目录 AGENTS.md 一致）

- **`@cat-kit/tests`、`@cat-kit/docs`**：可对其它包使用 `@cat-kit/<pkg>/src`。
- **其余包互相引用**：使用 **`@cat-kit/<pkg>` 的 dist**，不要用 `/src`。
- **集中测试**在 `packages/tests/`，引入被测代码可用 `@cat-kit/<pkg>/src`。

## 包一览

| 包名 | generated 目录 | 主题导航 |
|------|----------------|----------|
| `@cat-kit/core` | `generated/core/` | [references/core/](references/core/data.md) |
| `@cat-kit/http` | `generated/http/` | [references/http/](references/http/client.md) |
| `@cat-kit/fe` | `generated/fe/` | [references/fe/](references/fe/storage.md) |
| `@cat-kit/be` | `generated/be/` | [references/be/](references/be/fs.md) |
| `@cat-kit/excel` | `generated/excel/` | [references/excel/](references/excel/model.md) |
| `@cat-kit/maintenance` | `generated/maintenance/` | [references/maintenance/](references/maintenance/monorepo.md) |
| `@cat-kit/agent-context` | `generated/agent-context/` | [references/agent-context.md](references/agent-context.md) |
| `@cat-kit/cli` | `generated/cli/` | [references/cli.md](references/cli.md) |

外置安装与版本说明：[_meta.md](references/_meta.md)。长文教程见仓库 `docs/`。

## 使用方式

- **优先只打开与本问题相关的 `generated/<pkg>/` 下若干 `.d.ts`**，不要一次加载整棵 generated 树。
- `references/*.md` 仅作分模块导航；类型以 **`generated`** 为准。
