---
name: use-cat-kit
description: >
  Routes Cursor agents to per-package CatKit documentation skills under skills/cat-kit-* (npm-aligned typings or tsconfig JSON).
  Use when the user works with any @cat-kit/* package and needs API discovery; open the matching cat-kit-<pkg> skill instead of loading monolithic generated trees.
---

# use-cat-kit（路由）

面向已安装 **npm 包 `@cat-kit/*`** 的真实项目：按正在使用的包打开下表中的**对应技能目录**，从该目录的 `SKILL.md` 入口阅读；权威 API 以各技能下的 `generated/` 为准。

| npm 包                     | 技能目录                                                        |
| -------------------------- | --------------------------------------------------------------- |
| `@cat-kit/core`            | [cat-kit-core/](../cat-kit-core/SKILL.md)                       |
| `@cat-kit/http`            | [cat-kit-http/](../cat-kit-http/SKILL.md)                       |
| `@cat-kit/fe`              | [cat-kit-fe/](../cat-kit-fe/SKILL.md)                           |
| `@cat-kit/be`              | [cat-kit-be/](../cat-kit-be/SKILL.md)                           |
| `@cat-kit/agent-context`   | [cat-kit-agent-context/](../cat-kit-agent-context/SKILL.md)     |
| `@cat-kit/cli`             | [cat-kit-cli/](../cat-kit-cli/SKILL.md)                         |
| `@cat-kit/tsconfig`        | [cat-kit-tsconfig/](../cat-kit-tsconfig/SKILL.md)               |
| `@cat-kit/vitepress-theme` | [cat-kit-vitepress-theme/](../cat-kit-vitepress-theme/SKILL.md) |

## 维护者（本仓库）

在仓库根目录刷新所有子技能的 `generated/`：

- `bun run sync-cat-kit-skills-api` — 仅复制（需各包已有 `dist`）
- `bun run sync-cat-kit-skills-api:build` — 先 tsdown / tsc 再复制

脚本：`scripts/sync-cat-kit-skills-api.ts`。
