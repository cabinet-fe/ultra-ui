# 07 — 查看器导出入口与拖拽落点高亮补迁

**What to build:** `UReportViewer` expose `exportXlsx()` 并在取数完成前拒绝执行；把 redesign issue 10 的拖拽落点高亮 overlay 补迁进产品化设计器。两项均不碰引擎，可随时并行插队。

**Blocked by:** 无

**Status:** done

- [x] `UReportViewer` expose `exportXlsx()`：内部取填充后的 sheet 与运行时捕获的列宽，走 `exportFilledReportXlsx` + `saveBlob`
- [x] **不内置导出按钮**：工具栏有无由下游决定（与 `refresh()` 的既有形态一致）；`ReportViewerExposed` 类型同步
- [x] 取数完成前调用 `exportXlsx()` 直接拒绝并给可读错误（修 productization issue 07 记录的「导出按钮在查看器取数完成前可点，导出的是铺底模板结构而非填充报表」）
- [x] 设计器预览态的导出按钮改为转调查看器 expose 的 `exportXlsx()`，消除设计器侧的重复导出路径
- [x] 拖拽落点高亮 overlay 补迁：dragover 时目标格虚线高亮，落空时提示回退当前选区。基础设施 `designer/use-grid-overlay.ts` 与 `designer/cell-coords.ts` 已就位
- [x] 组件级测试：取数前 `exportXlsx()` 拒绝、取数后成功产出 blob、落点高亮随 dragover 更新目标格

## Comments

- **`export-xlsx.ts` 与 sheet-core `io/export` 的格分发重复**（productization issue 07 记录的既有重复）不在本票范围：收敛需要 sheet-core 导出 `cellToHucreCell`，动公共面，仍留待消费驱动。
