# patch-3: tsdown 声明管线替代 vue-tsc + icons-example

## 补丁内容

- **icons 构建**：移除对 `vue-tsc` 的直接依赖与 `spawn` 调用。`rolldown-plugin-dts` 无法将大量 `.vue` 单独作为 entry 纳入 program（会报 Unable to load file），改为**仅**以 `index.ts` / `normal.ts` / `colorful.ts` 为入口、`unbundle: true`，由 tsdown 一次性产出 `dist/vue/**` 的 JS 与 `dts: { vue: true }` 声明；脚本内后处理将 `*.vue.d.ts` 重命名为 `*.d.ts`，并把声明中的 `.vue.js` 改为 `.js`，以符合 `package.json` exports。
- **依赖**：自 `package.json` 移除 `vue-tsc`；`bun update --latest` 将 `svgo` 等 devDependencies 对齐 npm 当前最新（如 `svgo@4`）。
- **示例应用**：新增 `apps/icons-example`（Vue 3 + Vite 8 + `@vitejs/plugin-vue` 6），端口 `7789`，开发时 alias 指向 `packages/icons/src`；界面参考 Lucide（Inter、浅灰底、顶栏 + 搜索、卡片网格、点击复制具名 import）。

## 影响范围

- 新增文件: `apps/icons-example/package.json`、`apps/icons-example/vite.config.ts`、`apps/icons-example/index.html`、`apps/icons-example/tsconfig.json`、`apps/icons-example/src/main.ts`、`apps/icons-example/src/App.vue`、`apps/icons-example/src/vite-env.d.ts`
- 修改文件: `packages/icons/scripts/build-vue-icons.ts`、`packages/icons/package.json`、根目录 `bun.lock`
