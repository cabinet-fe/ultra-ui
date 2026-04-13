# 图标 Vue 生成移除根 svg 宽高

## 补丁内容

- `gen-vue-icons.ts` 不再在根 `<svg>` 上追加 `width="1em"` / `height="1em"`；源 SVG 根上的 `width`/`height` 仍由 `serializeSvgAttrs` 过滤（沿用既有逻辑）。
- 将 `serializeSvgAttrs` 的拼接改为每属性一行、缩进与原先手排风格一致；`GEN_TAG` 递增至 `gen:4`，使已生成的 `.vue` 全量重写以应用新模板。
- 已执行 `bun run icons:gen` 重生成 `src/vue/**` 下全部 SFC。

## 影响范围

- 修改文件: `packages/icons/scripts/gen-vue-icons.ts`
- 修改文件: `packages/icons/src/vue/normal/*.vue`、`packages/icons/src/vue/colorful/*.vue`（脚本批量重写）
