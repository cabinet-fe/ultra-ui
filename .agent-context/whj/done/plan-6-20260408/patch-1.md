# 菜单路径遍历抽离

## 补丁内容

审查后将 `walkMenuWithPath` 从 `menu.vue` 移至 `walk-menu-path.ts`，减轻 SFC 体积并集中说明与 `@cat-kit/core` `dfs` 的语义差异，便于后续单测或复用。

## 影响范围

- 新增文件: `packages/desktop/src/components/menu/walk-menu-path.ts`
- 修改文件: `packages/desktop/src/components/menu/menu.vue`
