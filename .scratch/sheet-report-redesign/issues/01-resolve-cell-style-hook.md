Status: ready-for-agent

# 01 — `@veltra/sheet` 动态单元格样式 Hook (`resolveCellStyle`)

**What to build:** 
在 `@veltra/sheet-core` (SheetGrid) 与 `@veltra/sheet` (USheet) 视口渲染流程中加入 `resolveCellStyle(addr, baseStyle)` 动态回调钩子。使得当网格渲染单元格时，能够在保持底层 Cell Store 数据不变的前提下，根据单元格地址和静态基础样式动态叠加条件补丁样式，同时保证视口 60fps 的流畅渲染。

**Blocked by: `00-sheet-grid-refactor.md`

- [ ] `SheetGrid` 和 `USheet` 支持传入 `resolveCellStyle` 属性/回调
- [ ] 视口单元格渲染时，`resolveCellStyle` 能接收到单元格地址 `(row, col)` 与从 `StylePool` 获取的 `baseStyle`，并正确返回合并后的 `CellStyle`
- [ ] 未指定 `resolveCellStyle` 或 Hook 返回 `undefined` 时，原样应用 `baseStyle`，无性能衰减
- [ ] 编写自动化单元测试，验证 `resolveCellStyle` 的触发时机与样式叠加正确性
