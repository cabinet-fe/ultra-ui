# 修正 use-desktop 技能生成目录

## 补丁内容

将 `use-desktop` 技能从错误的 `.agents/skills/use-desktop` 迁移到正确的 `skills/use-desktop`，并修正同步命令与脚本根目录计算逻辑，确保 `bun run sync-use-desktop` 在新目录结构下可正常执行。

## 影响范围

- 新增文件: `skills/use-desktop/SKILL.md`
- 新增文件: `skills/use-desktop/scripts/sync-docs.ts`
- 新增文件: `skills/use-desktop/references/dev-patterns.md`
- 新增文件: `skills/use-desktop/generated/catalog.md`
- 新增文件: `skills/use-desktop/generated/form.md`
- 新增文件: `skills/use-desktop/generated/data-display.md`
- 新增文件: `skills/use-desktop/generated/feedback.md`
- 新增文件: `skills/use-desktop/generated/navigation.md`
- 新增文件: `skills/use-desktop/generated/layout.md`
- 新增文件: `skills/use-desktop/generated/editor.md`
- 新增文件: `skills/use-desktop/generated/general.md`
- 新增文件: `skills/use-desktop/generated/shared-types.md`
- 新增文件: `skills/use-desktop/generated/manifest.json`
- 修改文件: `package.json`
