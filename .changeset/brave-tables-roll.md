---
'@veltra/sheet': minor
---

USheet 新增 `scrollbar` 属性（默认开启，`false` 关闭）：透传 infinitable 引擎内建画布滚动条——内容溢出的轴在画布右/下缘绘制滚动条，支持拖拽滑块、点按轨道跳转，滚轮/触控/惯性滚动联动；几何刷新由引擎内部驱动（列宽/行高变更、容器 resize 即时更新），宿主零接线。需配合 `infinitable >= 0.1.2`。
