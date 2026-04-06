# 构建与开发环境重建

> 状态: 已执行

## 目标

将构建系统从 tsdown + rolldown 迁移到 @cat-kit/maintenance，移除 @builder/vite 改用原生 vite 插件，确保多包构建产物和开发预览正常工作。

前置条件：Plan-4 全部完成且验证通过。

## 内容

### 1. 验证 @cat-kit/maintenance 构建能力

**决策（方案 B）**：`buildLib` / `group.build` 的 `BuildConfig` 不支持注入 Vue SFC、JSX、自定义 SCSS 等 rolldown 插件；保留 **tsdown** 完成 `@ultra-ui/core` / `styles` / `directives` / `pc` 的 unbundle 与 d.ts 生成。发版侧使用 `@cat-kit/maintenance` 的 `Monorepo`、`WorkspaceGroup.publish` 等 API。

### 2. 重写构建脚本（JS/Vue 编译阶段）

已按依赖顺序在 `build/build.ts` 中串联：`core` → `styles` → `directives` → `pc`；`pc` 使用 `external: /^@ultra-ui\//` 保留 workspace 裸导入。

### 3. 重写样式构建阶段

`build/build-styles.ts`：`scssPlugin(distRoot, nestStylesFromPackage)`，loadPaths 为 `[packages/styles/src, dirname(absolutePath)]`；PC 侧将 styles 内 SCSS 嵌到 `dist/styles/...`；`@ultra-ui/styles` 本体构建时扁平输出到 `packages/styles/dist`。

### 4. 重写 post-build 步骤

`build/prepare.ts`：SCSS 源与 fonts 复制到 `packages/styles/dist`；README 复制到各包 `dist/`；各包 `dist/version.js` 与 `dist/version.d.ts`。`exports` 与各包 `package.json` 的 `files: ["dist"]` 在源码包内维护（不再写入独立 dist/package.json）。

### 5. 重写发布脚本

`build/release.ts`：`publishWorkspacePackages` 使用 `Monorepo(ROOT).group([...]).publish({ registry, dryRun, access })`；registry 读取 `.npmrc` 中 `@ultra-ui:registry=`；`bun index.ts --release --dry-run` 可将 `dryRun` 传给 publish。

### 6. 重写 sample/vite.config.ts

已移除 `@builder/vite`，使用 `@vitejs/plugin-vue`、`@vitejs/plugin-vue-jsx`、`unplugin-vue-components` 与自定义 `U*` 解析器（含 style 路径回退）。

### 7. 更新 sample 和 build 的 package.json

已更新 `sample/package.json` 与 `build/package.json`（含 `@cat-kit/maintenance`）。

### 8. 端到端验证

本地已执行：`bun vitest run`、`cd build && bun index.ts`、`cd sample && bun run build` 通过（`bun install` 若网络失败需在本机重试）。

## 影响范围

- `build/release.ts`
- `AGENTS.md`
- `.npmrc`
- `build/build.ts`
- `build/build-styles.ts`
- `build/index.ts`
- `build/package.json`
- `build/prepare.ts`
- `build/shared.ts`
- `packages/core/package.json`
- `packages/core/tsconfig.json`
- `packages/directives/package.json`
- `packages/directives/tsconfig.json`
- `packages/pc/package.json`
- `packages/pc/tsconfig.json`
- `packages/styles/package.json`
- `packages/styles/tsconfig.json`
- `sample/package.json`
- `sample/vite.config.ts`

## 历史补丁

- patch-1: release 标签取消覆盖时跳过推送标签
