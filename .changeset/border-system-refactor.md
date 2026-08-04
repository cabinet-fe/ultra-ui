---
'@veltra/sheet': minor
---

边框系统重构（修复外边框右边/下边不生效、中间网格线丢失）：

- `CellStylePatch.border` 边值支持 `null`（边级删除）：`border` 字段从重定义整个边集合改为
  **边级合并**——边值为对象与既有边合并、为 `null` 删除该边、未列出的边保留
  （`border: {}` 不再清除全部边框，清除需显式四边 `null`）
- 新增 `core/style/border-presets`（`buildBorderPresetItems` / `BorderPreset` / `BorderPresetItem`）：
  边框预设生成迁入 core（纯函数），并对齐 Excel/univer「写入时同步邻居」——外边框/无边框
  同步清选区外一圈邻居的对侧边，下边框清下一行邻居 top；一次预设应用 = 单 undo 单元，
  undo 自动还原邻居格
- 渲染层修复两条根因：未自定义的边显式回落主题网格线（`GRID_BORDER`/1px，修「只设填充
  或部分边时网格线丢失」）；主题新增 `cellBorderClipDirection: 'bottom-right'`（修「1px 右/
  下边框落在邻居格内被填充覆盖」），配合共享边双向溯源（每边 = 本格自定义边 ?? 邻居对侧
  边 ?? 网格线）与 `cell-change` 四邻样式缓存刷新
- `vtable-theme.ts` 导出 `GRID_BORDER` 常量（sheet-grid 网格线回落共用，消除两处硬编码漂移）
