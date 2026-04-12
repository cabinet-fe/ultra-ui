# 移除各包 `tsc -b` 构建脚本

## 补丁内容

- 与「不使用 `tsc` 作为约定工作流」一致，将原 `build: tsc -b` 替换为无输出的 Bun 占位（`bun -e 'void 0'`），保留 `build` 脚本键以便 Turbo `^build` 依赖图仍可按序执行。
- 涉及包：`@veltra/utils`、`compositions`、`directives`、`mobile`、`desktop` 与 `tools/cli`。`tools/build`、`packages/icons` 等非 `tsc -b` 构建保持不变。

## 影响范围

- 修改文件: `packages/utils/package.json`、`packages/compositions/package.json`、`packages/directives/package.json`、`packages/mobile/package.json`、`packages/desktop/package.json`、`tools/cli/package.json`
