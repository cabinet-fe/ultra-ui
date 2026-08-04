---
'@veltra/desktop': minor
'@veltra/sheet': minor
---

右键菜单增强 + 行列头菜单：

- `@veltra/desktop` `ContextmenuItem` 新增 `divider` / `render` / `keepOpen`；导出
  `ContextmenuRootDIKey` 供内嵌组件主动关闭菜单
- `@veltra/sheet` 行号/列头右键独立菜单（插入上下/左右 + 删除 + 冻结/取消冻结）；
  body 插入行/列改为菜单内嵌 `UNumberInput`（默认 N = 选区覆盖行/列数），不再弹独立面板
- 修复 `deleteRows` / `deleteCols` undo 不还原删除区间内单元格数据的问题
    （`prepareDeletedCellPatches` + undo 在反向结构之后恢复）
