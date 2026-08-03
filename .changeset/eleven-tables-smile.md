---
'@veltra/sheet': minor
---

电子表格增强（plans/sheet-enhancement Phase 1-5）：

- 样式系统：StylePool 按内容去重，单元格持 StyleId；背景填充 / 四边边框，命令可 undo
- 冻结行列：模型状态持久化，VTable 映射即时生效；查找替换（显示值 / 公式原文、大小写、整格匹配，替换单 undo 单元）
- 多 sheet：renameSheet 跨表引用跟随，removeSheet 联动引用方重算 `#REF!`；tab 栏添加 / 重命名 / 删除
- 公式栏：名称框 + fx 输入栏，与网格双向同步（`showFormulaBar` prop）
- 导入导出：XLSX / CSV（hucre），值 / 公式 / 合并 / 样式 / 冻结保真
- 选区回驱：模型选区与 VTable 高亮双向同步
