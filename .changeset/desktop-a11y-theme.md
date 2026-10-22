---
'@veltra/desktop': patch
---

无障碍与主题化。

- `UCheckTag` 与 `UCheckboxButton` 支持键盘操作：根元素带 `role="checkbox"` 与 `aria-checked`，可聚焦，`Enter` / `Space` 与点击等效切换。
- `UDialog` 最大化/还原在系统开启「减弱动态效果」时直接就位，不再播放位移动画。
- `UPopConfirm` 图标默认颜色由写死的 `#ffc107` 改为跟随主题 `warning` 色，暗色主题下不再突兀；传 `iconColor` 可恢复旧颜色。
- `UTheme` 卡片的强调色、阴影、滚动条等写死颜色改为主题 token。
