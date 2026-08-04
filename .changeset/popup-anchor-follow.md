---
'@veltra/sheet': minor
'@veltra/utils': patch
---

- `@veltra/sheet`：弹层型工具面板（填充/边框/字体色/字号/查找/导入/导出）改为 `UDropdown`
  锚点定位（Teleport 到 `#pop-container` + floating-ui）——面板左缘跟随触发按钮、自动翻转 /
  边界移位；工具栏滚动 / 窗口缩放时自动关闭（不再固定钉在工具栏右下角）
- `@veltra/utils`：`getScrollParents` / `getNearestScrollParent` 将横向可滚动父级
  （`overflow-x` 容器）计入——弹层在横向滚动容器内能正确监听滚动并自动关闭
