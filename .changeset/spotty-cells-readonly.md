---
'@veltra/sheet-core': minor
---

feat(sheet-core): 新增单元格级只读标记（`Sheet.setCellReadonly` / `setRangeReadonly` / `isCellReadonly`，经 Cell Meta 存储，可撤销、随快照序列化、行列结构平移）；SheetGrid 拦截只读格编辑——不开启编辑器（双击/Enter）、`CHANGE_CELL_VALUE` 回写守卫、填充柄跳过只读目标格，支撑表格化填报场景
