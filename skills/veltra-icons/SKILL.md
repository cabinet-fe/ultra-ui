---
name: veltra-icons
description: 面向 `@veltra/icons` 的图标库文档技能。用于选择或引用 normal/colorful 图标、理解自动生成的 Vue SFC 与 barrel 入口、维护 SVG 命名与格式化工作流，或新增图标后重新生成 `src/vue/*`、`src/normal.ts`、`src/colorful.ts` 时使用。
---

# Veltra Icons

## 只在这些场景用本 skill

- 需要判断图标应该从 `@veltra/icons/normal` 还是 `@veltra/icons/colorful` 引入
- 需要新增 SVG、批量重命名、格式化或重新生成 Vue 图标
- 需要确认哪些文件是自动生成、哪些文件才是 source of truth

## 直接读取这份 reference

- [references/source-discovery.md](references/source-discovery.md)
- [references/usage-and-generation.md](references/usage-and-generation.md)

## 先记住这几个规则

- `src/vue/`、`src/normal.ts`、`src/colorful.ts` 都是生成产物，不手改
- source of truth 是 `src/svg/normal/` 与 `src/svg/colorful/`
- 单色图标会做保守的黑色 -> `currentColor` 替换
- colorful 图标保留原始多色 fill/stroke
