# patch-2: 修复 tools/build 指向已删除的 ui/ 目录

## 补丁内容

- **`tools/build/shared.ts`**：`UI_ROOT` 改为 `packages/desktop/src`；新增 `DESKTOP_PKG`、`PACKAGES`、`workspaceTsAliases`（含 `@veltra/*`、`ultra-ui` 构建别名）。
- **`build.ts` / `prepare.ts` / `index.ts` / `release.ts`**：入口与 `package.json`、样式拷贝路径对齐 monorepo（`DESKTOP_PKG`、`UTILS_SRC`）。
- **`build-styles.ts`**：拆成三次 `tsdownBuild`（desktop `components/**/style.ts`、directives `**/style.ts`、utils `styles/index.ts`）；SCSS 插件按 `packages/*` 多根目录解析，`loadPaths` 含 monorepo `packages/`；`format` 类型满足 `InlineConfig`。
- **`context-menu/style.ts`**：遗留的 `../../styles/...` 改为 `@veltra/utils/styles/...`。
- **`code-editor.vue`**：`ultra-ui` 改为 `@veltra/desktop`。

## 影响范围

- 修改文件: `tools/build/shared.ts`、`build.ts`、`build-styles.ts`、`prepare.ts`、`index.ts`、`release.ts`、`packages/desktop/src/components/context-menu/style.ts`、`packages/desktop/src/components/code-editor/code-editor.vue`
