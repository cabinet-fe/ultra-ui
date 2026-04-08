# 生成 Vue 图标移除 size prop

## 补丁内容

- 按约定，由 `gen-vue-icons.ts` 产出的图标组件**不声明任何 props**（原先唯一的 `size` 已移除）。
- 根 `<svg>` 使用固定 `width="1em"`、`height="1em"`，与 `UIcon` 在包裹元素上设置的 `font-size` 对齐，行为与此前默认 `size: '1em'` 一致。
- 跳过写入条件增加生成器版本标记 `gen:2`，避免仅改模板时因 SVG hash 未变而漏更新 `.vue`。
- `apps/icons-example` 网格预览改为在 `.icons-app__svg` 上设 `font-size: 24px`，不再向动态图标传 `size`。

## 影响范围

- 修改文件: `packages/icons/scripts/gen-vue-icons.ts`
- 修改文件: `packages/icons/src/vue/**/*.vue`（`bun ./scripts/gen-vue-icons.ts` 全量重写）
- 修改文件: `apps/icons-example/src/App.vue`（预览网格用 `font-size` 控制 24px，不再向图标传 `size`）
