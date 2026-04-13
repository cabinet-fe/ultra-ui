---
name: veltra-desktop
description: 面向 `@veltra/desktop` 的桌面端组件库文档技能。用于新增、修改、排查或按需引入桌面组件，追踪 `src/components` 与 `src/types` 的配套关系，维护 `style.ts` 副作用入口、表单组件模式、`di.ts` 上下文、内置 `vLoading` 指令，以及借助 `playgrounds/desktop` 示例快速理解真实用法时使用。
---

# Veltra Desktop

## 先选入口，不要一口气读完

- 先读 [references/source-discovery.md](references/source-discovery.md)
  当 skill 被复制到其它项目，需要先找到 `@veltra/desktop` 的 workspace 源码、`node_modules` 安装产物、类型声明、playground 替代物时
- 先读 [references/architecture.md](references/architecture.md)
  当你需要理解包结构、依赖关系、当前仓库的真实边界与已知偏差时
- 再读 [references/component-authoring.md](references/component-authoring.md)
  当你要新增组件、修复组件、补类型或补样式副作用入口时
- 再读 [references/component-catalog.md](references/component-catalog.md)
  当你要找某个组件、按功能浏览已有实现、判断有没有 playground 示例时
- 最后读 [references/playground.md](references/playground.md)
  当你要跑示例、追踪路由、看自动按需引样式链路时

## 执行时坚持这些事实

- 组件源码在 `src/components/<name>/`
- 公开类型不写在组件目录，统一放在 `src/types/<name>.ts`
- 样式副作用入口必须走 `style.ts`
- 表单控件优先使用 `useFormComponent()` 与 `useFormFallbackProps()`
- 复杂父子上下文优先使用 `di.ts`
- 组件名使用 `U` + PascalCase，目录名使用 kebab-case

## 处理跨包问题时顺带查这些邻近 skill

- 样式基础设施与 theme runtime：`veltra-styles`
- 公共逻辑 hook：`veltra-compositions`
- 公共指令：`veltra-directives`
- 图标来源与生成：`veltra-icons`

## 快速源码锚点

- `packages/desktop/src/index.ts`
- `packages/desktop/src/components/index.ts`
- `packages/desktop/src/types/index.ts`
- `packages/desktop/src/components/breadcrumb/breadcrumb.vue`
- `packages/desktop/src/components/button/button.vue`
- `packages/desktop/src/components/form/form.vue`
- `packages/desktop/src/components/select/select.vue`
- `packages/desktop/src/components/table/table.vue`
- `packages/desktop/src/components/theme/theme.vue`
