# tsc 产物目录隔离

## 补丁内容

根级 `tsc --build` 曾在 `tools/build/`、`tools/cli/` 源码旁、`apps/sample/` 根目录生成 `.js` / `.d.ts`，易误提交且污染工作区。

为 `tools/build`、`tools/cli` 配置 `rootDir` + `outDir: ./dist-tsc`；为根 `tsconfig.node.json` 配置 `vite.config` 的声明产物输出到 `apps/sample/.tsc-vite-config/`。在 `.gitignore` 中忽略上述目录；更新 `turbo.json` 的 `build` outputs 以包含 `dist-tsc/**`。删除已误入源码树旁的生成文件。

## 影响范围

- 修改文件: `tools/build/tsconfig.json`
- 修改文件: `tools/cli/tsconfig.json`
- 修改文件: `tsconfig.node.json`
- 修改文件: `.gitignore`
- 修改文件: `turbo.json`
- 删除文件: `tools/build/*.js`、`tools/build/*.d.ts`（源码旁误生成物）
- 删除文件: `tools/cli/**/*.js`、`tools/cli/**/*.d.ts`（源码旁误生成物）
- 删除文件: `apps/sample/vite.config.js`、`apps/sample/vite.config.d.ts`（误生成物）
