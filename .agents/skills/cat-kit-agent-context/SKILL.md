---
name: cat-kit-agent-context
description: >
  Documents @cat-kit/agent-context CLI and workspace metadata for agent workflows. Use when integrating cat-kit agent context CLI or reading workspace constants from this package.
---

# @cat-kit/agent-context

## 安装

```bash
npm add @cat-kit/agent-context
```

## 查证 API

[`generated/`](generated/) 下 **`.d.ts`** 与 npm `dist` 一致；发布物里的 ESM JavaScript 文件统一使用 `.js` 后缀，其中 Skill 安装依赖的上下文脚本会发布在 `dist/skill/scripts/get-context-info.js`。

**运行环境**：Node.js（CLI / 工具链）。

## 更多

- [references/workspace.md](references/workspace.md)
- [examples.md](examples.md)
