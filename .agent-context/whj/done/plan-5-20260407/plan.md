# 全量 ESM 现代化与依赖升级（plan-5）

> 状态: 已执行

## 目标

消除 workspace 包在已配置 `exports` 时仍保留的 `main`/`module`（及冗余 `types`）带来的解析歧义；移除 `install` 中的 `import * as` 命名空间导入，改为显式注册表与具名导入；在各包 TS 配置中显式固定 `moduleResolution: "bundler"` 与 ESM 导向选项；将 monorepo 内声明的依赖升级到当前注册表允许的最新稳定版本；跑通 `vitest`、library `build`、sample 的 `vite build` 与 `vite dev`，并用浏览器 MCP 打开 sample 确认无控制台错误与关键警告。

## 内容

1. **package.json 导出字段整理**：在 `@ultra-ui/core`、`@ultra-ui/pc`、`@ultra-ui/styles`、`@ultra-ui/directives` 中删除 `main`、`module` 及与 `exports["."]` 重复的顶层 `types`，仅保留 `type: module`、`files`、`sideEffects`（如有）、`exports`、`dependencies`/`peerDependencies` 等必要字段；核对 `exports` 中 `.` 与子路径均含 `types` + `import`（styles 的 `"./*"` 若需类型则补全与 `import` 对称的条件）。
2. **install 注册表**：新增 `packages/pc/src/component-install-registry.ts`（或等价路径），从 `./components` 具名导入全部以 `U` 开头的组件符号，导出供 `install` 使用的 `Record` 或只读映射；将 `packages/pc/src/install.ts` 改为使用该映射注册组件；指令侧从 `@ultra-ui/directives` 具名导入 `vFocus`、`vClickOutside`、`vRipple`（及既有逻辑所需项），以显式对象迭代替代 `import * as directives`；保持与原先相同的 `app.directive` 命名规则（`key.slice(1)`）与 `vLoading` 注册行为。
3. **TypeScript 配置**：在 `packages/core`、`packages/pc`、`packages/styles`、`packages/directives`、`sample`、`cli`、`build` 的 `tsconfig.json` 的 `compilerOptions` 中显式设置 `moduleResolution: "bundler"`（若 `extends` 已包含则重复声明以确保工具链一致）、`module: "ESNext"`（若未继承），不削弱现有 `strict`/`verbatimModuleSyntax` 等约束。
4. **依赖升级**：在仓库根目录使用 `bun` 将各 workspace `package.json` 中可升级的 `dependencies`/`devDependencies` 升至注册源上的最新兼容主版本（不修改 `.npmrc`）；执行 `bun install` 刷新 lockfile；若某包 major 破坏构建，在该步骤内修复调用方或锁定次优版本并在影响范围中说明。
5. **验证闭环**：根目录运行 `bun vitest`；`cd build && bun index.ts`；`cd sample && bun run build`；`cd sample && bun dev`（后台）后通过浏览器 MCP 访问开发服务器默认端口，检查控制台无 error、无阻碍性 warning；修复直至上述命令与页面检查均通过。
6. **计划收尾**：将本文件状态行改为 `已执行`；在 `## 影响范围` 列出所有改动文件路径（不含 `.agent-context/`）。

## 影响范围

- `package.json`、`bun.lock`
- `build/package.json`、`build/tsconfig.json`
- `cli/package.json`、`cli/tsconfig.json`
- `packages/core/package.json`、`packages/core/tsconfig.json`
- `packages/pc/package.json`、`packages/pc/tsconfig.json`、`packages/pc/src/install.ts`、`packages/pc/src/component-install-registry.ts`（新增）
- `packages/styles/package.json`、`packages/styles/tsconfig.json`
- `packages/directives/package.json`、`packages/directives/tsconfig.json`
- `sample/package.json`、`sample/tsconfig.json`、`sample/vite.config.ts`、`sample/App.vue`
- `tsconfig.node.json`
- `cli/gen-pc-install-registry.ts`（patch-1）

## 历史补丁

- patch-1: PC install 注册表生成脚本
