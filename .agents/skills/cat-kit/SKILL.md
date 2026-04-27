---
name: cat-kit
description: >
  CatKit toolset documentation — progressive API reference for all @cat-kit/* packages.
  Use when working with any @cat-kit/* npm package and need precise API usage guidance.
---

# cat-kit

面向已安装 `@cat-kit/*` npm 包的真实项目。按需索引，渐进式阅读。

## 安装

```bash
bun add @cat-kit/core          # 核心工具（零依赖，通用）
bun add @cat-kit/http          # HTTP 客户端（插件架构）
bun add @cat-kit/fe            # 浏览器专用工具
bun add @cat-kit/be            # Node.js 专用工具
bun add @cat-kit/cli           # 命令行工具
bun add @cat-kit/agent-context # Agent Context 工具
bun add @cat-kit/tsconfig -D   # 共享 tsconfig 预设
bun add @cat-kit/vitepress-theme # 文档主题
```

## 包索引

| npm 包 | 运行环境 | 文档入口 |
|--------|----------|----------|
| `@cat-kit/core` | 通用 | [packages/core/index.md](packages/core/index.md) |
| `@cat-kit/http` | 通用 | [packages/http/index.md](packages/http/index.md) |
| `@cat-kit/fe` | 浏览器 | [packages/fe/index.md](packages/fe/index.md) |
| `@cat-kit/be` | Node.js | [packages/be/index.md](packages/be/index.md) |
| `@cat-kit/cli` | Node.js | [packages/cli/index.md](packages/cli/index.md) |
| `@cat-kit/agent-context` | Node.js | [packages/agent-context/index.md](packages/agent-context/index.md) |
| `@cat-kit/tsconfig` | — | [packages/tsconfig/index.md](packages/tsconfig/index.md) |
| `@cat-kit/vitepress-theme` | — | [packages/vitepress-theme/index.md](packages/vitepress-theme/index.md) |

## 渐进式阅读路径

1. 从上方包索引找到你正在使用的包，打开 `packages/<pkg>/index.md` 了解该包的 API 分类
2. 根据需要打开具体分类文档（如 `packages/core/data.md`），获取精确的函数签名、参数说明和用法
3. 需要精确类型签名时查阅 `generated/` 下的 `.d.ts` 声明文件
4. 各包的 `examples.md` 提供了典型使用场景的代码示例

## 类型参考

`generated/` 目录由 `scripts/sync-cat-kit-skills-api.ts` 自动生成，镜像各包 `dist/*.d.ts`，与 npm typings 完全一致。仅供类型查证，不建议作为主要阅读路径。

## 维护者

刷新 generated 类型：
- `bun run sync-cat-kit-skills-api` — 仅复制（需各包已构建 dist）
- `bun run sync-cat-kit-skills-api:build` — 先构建再复制
