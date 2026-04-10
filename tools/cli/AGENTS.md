# AGENTS.md — tools/cli

开发辅助 CLI 工具集。

## 工具列表

| 工具            | 命令                                                    | 用途                                                              |
| --------------- | ------------------------------------------------------- | ----------------------------------------------------------------- |
| `gen-component` | `bun tools/cli/gen-component/index.ts` 或 `bun run gen` | 交互式生成新组件脚手架（.vue + style.scss + index.ts + 类型文件） |
| `export`        | `bun tools/cli/export/index.ts` 或 `bun run export`     | 多选 desktop/src 下子目录，重写各目录的 index.ts barrel 导出文件  |
| `rename/types`  | `bun tools/cli/rename/types` 或 `bun run rename:types`  | 将 desktop/src/types 下的 .d.ts 复制为 .ts 并删除原文件           |

## gen-component 流程

交互式输入：

1. **组件名**（必填）：kebab-case，如 `date-picker`
2. **根元素**（可选）：默认 `div`，限定合法 HTML 标签
3. **描述**（可选）

生成文件（在 `packages/desktop/src/components/<name>/` 下）：

- `<name>.vue` — SFC 模板
- `index.ts` — `export { default as U<PascalName> } from './<name>.vue'`
- `style.scss` — BEM 骨架
- `style.ts` — 样式入口

同时在 `packages/desktop/src/types/` 下生成类型文件。

## 共享常量（shared.ts）

| 常量             | 值                                |
| ---------------- | --------------------------------- |
| `UI_PATH`        | `packages/desktop/src`            |
| `COMPONENT_PATH` | `packages/desktop/src/components` |

## 依赖

- `@cat-kit/be`、`@inquirer/prompts`、`picocolors`
