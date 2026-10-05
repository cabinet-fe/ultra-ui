---
'@veltra/desktop': minor
---

新增 13 个通用组件并全量导出注册：

- 新增 UAnchor 锚点导航、UAlert 行内提示条、URate 评分组件
- 新增 UAvatar 头像（含 UAvatarGroup）、UBackTop 回到顶部
- 新增 UDivider 分割线、USpace 间距、USkeleton 骨架屏
- 新增 UTransfer 双栏穿梭框、UCarousel 走马灯（含 UCarouselItem）
- 新增 UTimePicker 时间选择器、UDescriptions 描述列表、UTimeline 时间线

修复与内部优化：

- 修复 UTimeline 末项贴底、圆点尾线对齐与 UAlert 图标对齐问题
- 修复 UTimePicker 面板居中定位时序问题
- variable-picker 空态适配 UEmpty 的 text prop
- 20 个组件 defineOptions 名补 U 前缀；anchor / avatar / back-top / divider / skeleton / descriptions / time-picker / transfer / carousel 样式值收敛
