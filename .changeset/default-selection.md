---
'@veltra/sheet': minor
---

默认选区 A1 + 快照序列化选区：

- 新建工作簿 / `addSheet` 默认选中 A1（名称框、画布高亮、fx 输入栏可用）
- `SheetSnapshot.selection?` 往返保留选区；旧快照缺省回落 A1
- 导出已传 `activeSheet`（写 activeTab）；hucre 不支持 OOXML `<selection>`，导入一律默认 A1
