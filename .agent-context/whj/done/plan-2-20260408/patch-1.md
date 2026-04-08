# patch-1: 移除 cat-kit-fe-compat、修正 TS 继承与 Turborepo 根脚本

## 补丁内容

- **cat-kit**：删除工作区包 `@ultra-ui/cat-kit-fe-compat`；`@ultra-ui/desktop` 与 `sample` 声明依赖官方 `cat-kit`，业务统一 `import … from 'cat-kit/fe'`。npm 上的 `@cat-kit/fe` 与 cat-kit v3 的 `fe` 聚合导出范围不一致，类型与行为以 `cat-kit` 包 `fe` 子路径为准（可用 use-cat-kit 技能对照 `@cat-kit/core` 等拆分包的文档与 generated 类型）。
- **TypeScript**：新增 `packages/ts-config`（`base.json` → `@cat-kit/tsconfig` 根预设；`browser.json` 供 utils/compositions/directives/icons/mobile；`vue-library.json` 供 desktop；`node-tools.json` 供根 `tsconfig.node` 与 `tools/*`）。去掉 `packages/desktop/tsconfig.json` 的 `ignoreDeprecations`。`tools/cli`、`tools/build` 的 `exclude` 增加 `dist-tsc`，消除声明文件被当作根输入导致的 TS5055。
- **tools/cli**：将 `readDir` 用法迁移到 `@cat-kit/be@1` 的 `ReadDirOptions` / `DirEntry`（`isFile`/`isDirectory`、`onlyFiles` + `filter`），替换已废弃的 `readType`/`callback` 形态。
- **Turborepo**：根 `package.json` 增加 `private: true`、`build`/`dev`/`test` 脚本（与官方文档中根脚本委托 `turbo run …` 的惯例一致）；`AGENTS.md` 补充 `bun run build` 与 `ts-config` 目录说明。

## 影响范围

- 删除目录: `packages/cat-kit-fe-compat/`
- 新增目录: `packages/ts-config/`
- 修改文件: `packages/*/tsconfig.json`、`packages/desktop/package.json`、`apps/sample/package.json`、`apps/sample/vite.config.ts`、`vitest.config.ts`、`tsconfig.json`、`tsconfig.node.json`、`tools/cli/tsconfig.json`、`tools/build/tsconfig.json`、`tools/cli/export/index.ts`、`tools/cli/rename/types.ts`、根 `package.json`、`bun.lock`、`AGENTS.md`
