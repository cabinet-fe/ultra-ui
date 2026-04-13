# 新增 UBreadcrumb 面包屑组件

> 状态: 已执行

## 目标

在 `@veltra/desktop` 中提供符合项目规范的面包屑导航组件 `UBreadcrumb`，支持多级路径展示、分隔符与末级当前页语义，并在 playground 中可预览与验证构建通过。

## 内容

1. 在 `packages/desktop/src/types/breadcrumb.ts` 定义 `BreadcrumbItem`（含 `title`、`href`、`disabled`）、`BreadcrumbProps`（含 `items`、`size`、`lastLinked`）、`BreadcrumbEmits`（`click` 事件签名）、`BreadcrumbSlotScope`、`_BreadcrumbExposed` 与 `BreadcrumbExposed`。
2. 在 `packages/desktop/src/types/index.ts` 的合适字母序位置增加 `export * from './breadcrumb'`。
3. 在 `packages/desktop/src/components/breadcrumb/` 新增 `breadcrumb.vue`（`nav` + `ol`/`li`、末级 `aria-current="page"`、有 `href` 且可链时渲染 `a`、否则可点击项用 `span` 并 `emit('click')`）、`index.ts`、`style.ts`（仅引入 `./style.scss`）、`style.scss`（BEM `u-breadcrumb`、列表横向布局、链接与分隔符颜色使用 `fn.use-var`、尺寸使用与 `tag` 一致的 `m.size` 模式）。
4. 在 `packages/desktop/src/components/index.ts` 按字母序增加 `export * from './breadcrumb'`。
5. 在 `playgrounds/desktop/src/breadcrumb/index.vue` 新增演示页：基础 `items`、自定义 `separator` 插槽、`lastLinked` 与 `href` 示例，并演示无 `href` 时 `@click` 行为。
6. 在仓库根目录执行 `bun run check-types` 与 `bun run build`，修复直至通过。

## 影响范围

- `packages/desktop/src/types/breadcrumb.ts`
- `packages/desktop/src/types/index.ts`
- `packages/desktop/src/components/breadcrumb/breadcrumb.vue`
- `packages/desktop/src/components/breadcrumb/index.ts`
- `packages/desktop/src/components/breadcrumb/style.scss`
- `packages/desktop/src/components/breadcrumb/style.ts`
- `packages/desktop/src/components/index.ts`
- `playgrounds/desktop/src/breadcrumb/index.vue`
- `playgrounds/desktop/components.d.ts`
- `skills/veltra-desktop/references/component-catalog.md`
- `skills/veltra-desktop/SKILL.md`

## 历史补丁

- patch-1: 同步 veltra-desktop 技能与 UBreadcrumb
