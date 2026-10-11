---
'@veltra/sheet': minor
---

单元格超链接与图片右键 UI（hyperlink-image-ui 单位）

- 单元格超链接：body 右键按目标格状态出项（无链接「插入超链接」/ 有链接「编辑超链接 / 取消超链接」），配置弹窗（地址必填 + 显示文本留空沿用原值），悬停链接格显示 URL tooltip
- 图片：目标格含嵌入图时 body 菜单附加图片四项（预览 / 图片超链接 / 取消超链接 / 移除图片）；浮动图右键独立菜单（预览 / 设置超链接 / 取消超链接 / 删除图片），右键不穿透到格
- 预览打开全局 lightbox 大图（复用 @veltra/desktop 的 UImagePreviewer：缩放/平移/关闭）
- SheetContext 透出 cell link（setCellLink / getCellLink / clearCellLink）、cell image（insertCellImage / removeCellImage / getCellImage / hasCellImage）与 onCellImageChange 订阅
- SheetEmits 新增六个事件透传：cell-link-hover / cell-link-leave / cell-link-click / image-link-click / cell-image-change / float-context-menu
