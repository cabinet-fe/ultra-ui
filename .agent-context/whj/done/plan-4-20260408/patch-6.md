# playgrounds/icons 预览卡片与图标比例

## 补丁内容

- 缩小图标预览卡片：网格列 `minmax` 从 8.5rem 调至 6.75rem，卡片 `padding`/`gap` 收紧，网格 `gap` 略减。
- 缩小图标占位框（`.icons-app__glyph`）从 2.75rem 到 2.125rem，减少「空框感」。
- 放大实际渲染（`.icons-app__svg` 的 `font-size` 从 24px 到 30px），与 Vue 图标根节点 `1em` 尺寸一致，图标在卡片中更醒目。

## 影响范围

- 修改文件: `playgrounds/icons/src/App.vue`
