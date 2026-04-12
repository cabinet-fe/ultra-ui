# 废除 `cat-kit/fe` 子路径，拆分 `@cat-kit/core` / `cat-kit` / `@veltra/utils`

## 补丁内容

- 全仓库业务代码不再使用 `import … from 'cat-kit/fe'`。
- 与 `@cat-kit/core@1` 行为一致的符号（`date`/`Dater`、`debounce`、`n`、`o`（原 `obj`）、`sleep`、`last`、`safeRun`、`isUndef` 等）改为 `import … from '@cat-kit/core'`。
- 链式读写、`pick`/`omit`/`objMap`/`equal`、以及与原 cat-kit v3 `Tween` 行为对齐的动画类，集中到 `@veltra/utils`（`data-compat`、`tween`），避免依赖已拆包但 API 不同的 npm `@cat-kit/fe`。
- **`Tree` / `Forest` / `TreeNode`**：npm `@cat-kit/core@1` 的数据结构与 cat-kit v3 `fe` 不兼容；在升级到新一代树 API 之前，这些类型与实现仍从聚合包 **`cat-kit` 默认入口**（`import … from 'cat-kit'`，browser 解析同 v3 fe）导入，仅废除 **`/fe` 子路径**字面量。
- `packages/desktop`、`apps/sample`：`@cat-kit/core` + `cat-kit` 并存；移除对 `cat-kit/fe` 的依赖路径。

## 影响范围

- 新增文件: `packages/utils/src/utils/helper/tween.ts`
- 修改文件: `packages/utils/src/utils/helper/data-compat.ts`、`packages/utils/src/utils/index.ts`、`packages/desktop/package.json`、`apps/sample/package.json`、`AGENTS.md`，以及原引用 `cat-kit/fe` 的全部 `packages/desktop`、`apps/sample` 源码文件
