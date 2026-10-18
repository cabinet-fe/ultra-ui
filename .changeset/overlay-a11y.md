---
'@veltra/desktop': minor
---

`UDrawer` / `UDialog` 新增通用遮罩交互与无障碍行为：

- 按 Esc 关闭：挂 `document` 级监听，不要求焦点位于遮罩上；新增 `closeOnEsc` prop（默认 `true`）。多层遮罩叠加时只关闭最上层。
- 锁定 `body` 滚动：新增 `lockScroll` prop（默认 `true`；`UDialog` 仅 `modal` 时生效），打开时按滚动条宽度补偿 `padding-right` 防止页面右移，关闭或卸载后恢复原内联样式。
- 焦点管理：打开时焦点移入面板（优先第一个可聚焦元素），`Tab` / `Shift+Tab` 在面板内循环，关闭后焦点回到打开前的元素。
- 面板带 `role="dialog"`（`UDialog` 模态时带 `aria-modal="true"`），传 `title` 时用 `aria-labelledby` 关联标题。

`UDialog` 顺带修复初始 `modelValue: true` 时不渲染的问题（现在直接展示，初始挂载不播进入动画）；其 Esc 关闭路径由遮罩 `keyup` 改为 document 级监听，遮罩不再带 `tabindex`。
