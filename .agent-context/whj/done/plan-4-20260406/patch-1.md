# 迁移 @lucide/vue 与数字输入步进图标

## 补丁内容

- 将 `lucide-vue-next`（0.500）升级为官方包 `@lucide/vue` ^1.7.0，全仓导入由 `'lucide-vue-next'` 改为 `'@lucide/vue'`；移除对 `lucide-vue-next` 的 postinstall 补丁脚本（新包无需该修补）。
- `NumberInput` 步进按钮由 `ArrowUp` / `ArrowDown` 改为 `ChevronUp` / `ChevronDown`，语义更符合增减控件。
- 文档：`AGENTS.md`、`MIGRATION.md` 中的包名与迁移说明同步为 `@lucide/vue`。

## 影响范围

- 新增文件: 无
- 修改文件: `package.json`、`packages/pc/package.json`、`sample/package.json`、`sample/App.vue`、`packages/pc/src/**/*.vue`、`packages/pc/src/**/*.ts`、`packages/pc/src/**/*.tsx`、`sample/src/**/*`、`AGENTS.md`、`MIGRATION.md`、`bun.lock`
- 删除文件: `scripts/patch-lucide-vue-next.mjs`
