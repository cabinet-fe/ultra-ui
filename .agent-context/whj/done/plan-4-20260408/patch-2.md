# 具名导出入口 `@ultra-ui/icons` / `@ultra-ui/icons/normal`

## 补丁内容

- 新增 `scripts/gen-icon-barrels.ts`，在 `icons:gen` 后生成 `src/normal.ts`、`src/colorful.ts`（具名 re-export 各 `.vue`）。
- `src/index.ts`：`export * from './normal'` + `export * from './colorful'`，保留 `packageName`。
- `build-vue-icons.ts`：在编译全部 `src/vue` 到 `dist/vue/` 后，再对 `normal.ts` / `colorful.ts` / `index.ts` 跑 tsdown，产出 `dist/normal.js`、`dist/colorful.js`、`dist/index.js`；vue-tsc 生成的 barrel `.d.ts` 去掉 `.vue` 扩展以便类型解析。
- `package.json` 增加 `exports` 字段 `./normal`、`./colorful`；`build` 去掉 `tsc -b`（改由构建脚本产出声明）。
- `packages/icons/tsconfig.json` 改为 `noEmit: true`（类型检查用）；`packages/desktop/tsconfig.json` 移除对 icons 的 project reference。
- 全仓业务图标导入改为 `import { … } from '@ultra-ui/icons/normal'`（彩色 `…/colorful`）。
- `apps/sample/vite.config.ts`：`@ultra-ui/icons`、`…/normal`、`…/colorful` 解析到 `packages/icons/src` 下对应 `.ts`，便于 dev。
- `icons:smoke-resolve` 从仓库根执行以便 Bun 解析 workspace；脚本增加对 `@ultra-ui/icons/normal` 的检查。

## 影响范围

- 新增文件: `packages/icons/scripts/gen-icon-barrels.ts`、`packages/icons/src/normal.ts`、`packages/icons/src/colorful.ts`
- 修改文件: `packages/icons/package.json`、`packages/icons/src/index.ts`、`packages/icons/tsconfig.json`、`packages/icons/tsconfig.icons-vue.json`、`packages/icons/scripts/build-vue-icons.ts`、`packages/icons/scripts/gen-vue-icons.ts`、`packages/icons/scripts/icon-naming.ts`、`packages/icons/scripts/smoke-resolve-subpath.ts`、`packages/desktop/tsconfig.json`、`packages/desktop/src/**`、`apps/sample/**`、`apps/sample/vite.config.ts`、`migrate.md`
