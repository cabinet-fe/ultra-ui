---
'@veltra/sheet': major
---

USheet 缺省滚动条切回画布常驻档（true）

- `SheetProps.scrollbar` 缺省从原生档 `{ mode: 'native' }` 改为 `true`——引擎归一化为画布常驻档（canvas always + reserve）：滚动条常驻画在画布内，`reserve` 只在画布内预留轨道，不占页面布局、不遮挡单元格
- 需浏览器原生滚动条（独立 gutter 渲染、不遮挡最底行/最右列）的宿主显式传 `:scrollbar="{ mode: 'native' }"`
- `scrollbar: false` 整体关闭、`true` 与对象形态（`mode: 'canvas'` 回画布档，含 `visibility` / `hideDelay` / `reserve` 显示策略）透传语义不变；对象形态仍为构造期选项，引用更替触发网格重建（勿在模板内联对象字面量）
