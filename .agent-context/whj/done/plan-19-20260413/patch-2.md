# 发布时移除 exports 的 development 条件

## 补丁内容

在 `changeset publish` 执行前，除继续展开内部 `workspace:*` 依赖外，对可发布的 `@veltra/*` 包临时从 `package.json` 的 `exports` 树中递归删除 `development` 条件。发布后 tarball 中的入口与宿主 Vite（含 `unplugin-vue-components` 触发的解析）一致地回落到 `import` / `types` / `sass` 等生产侧字段，避免仍优先命中仅适用于 monorepo 源码联调的 `development` 路径。

## 影响范围

- 修改文件: `tools/cli/release/with-resolved-workspace-versions.ts`
- 修改文件: `RELEASE.md`
