# 将技能目录替换为 veltra-desktop

## 补丁内容

将已生成的组件文档型技能从 `skills/use-desktop` 整体迁移并覆盖到 `skills/veltra-desktop`，确保最终交付目录符合 `@skills/veltra-desktop/` 约定。同时同步修正技能元信息与根脚本命令，避免目录替换后出现脚本路径失效或命名不一致。

## 影响范围

- 新增文件: `skills/veltra-desktop/generated/catalog.md`
- 新增文件: `skills/veltra-desktop/generated/form.md`
- 新增文件: `skills/veltra-desktop/generated/data-display.md`
- 新增文件: `skills/veltra-desktop/generated/feedback.md`
- 新增文件: `skills/veltra-desktop/generated/navigation.md`
- 新增文件: `skills/veltra-desktop/generated/layout.md`
- 新增文件: `skills/veltra-desktop/generated/editor.md`
- 新增文件: `skills/veltra-desktop/generated/general.md`
- 新增文件: `skills/veltra-desktop/generated/shared-types.md`
- 新增文件: `skills/veltra-desktop/generated/manifest.json`
- 新增文件: `skills/veltra-desktop/references/dev-patterns.md`
- 修改文件: `skills/veltra-desktop/SKILL.md`
- 修改文件: `skills/veltra-desktop/scripts/sync-docs.ts`
- 修改文件: `package.json`
- 删除文件: `skills/veltra-desktop/references/architecture.md`
- 删除文件: `skills/veltra-desktop/references/source-discovery.md`
- 删除文件: `skills/veltra-desktop/references/component-authoring.md`
- 删除文件: `skills/veltra-desktop/references/component-catalog.md`
- 删除文件: `skills/veltra-desktop/references/playground.md`
