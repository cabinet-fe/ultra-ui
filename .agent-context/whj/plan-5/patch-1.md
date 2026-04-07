# patch-1：PC install 注册表生成脚本

## 补丁内容

- 新增 `cli/gen-pc-install-registry.ts`：扫描 `packages/pc/src/components/*/index.ts` 中 `as U*` 符号，重写 `packages/pc/src/component-install-registry.ts`，避免新增组件时手工维护 80+ 行导入。
- 根目录 `package.json` 增加脚本 `gen:pc-install-registry`，与现有 `gen` / `export` 用法一致（`bun run gen:pc-install-registry`）。

## 影响范围

- 新增文件: `cli/gen-pc-install-registry.ts`
- 修改文件: `package.json`
