---
'@veltra/icons': minor
'@veltra/sheet': minor
---

工具栏重构（图标化 / 分区 / 精简 / 导出合并）：

- `@veltra/icons`：新增 sheet 工具栏缺口图标（bold/italic/underline/strikethrough/font-color/font-size/fill/border/merge-cells/unmerge-cells/wrap）
- `@veltra/sheet`：内置工具重组为 history｜cell｜text｜edit｜file；全面图标 + UTip tooltip
- 移除 structure/freeze 工具栏入口与 insert-cells-popup（行列插入删除/冻结改由右键菜单）
- 导出合并为单 `export` 弹层（Excel / CSV）；playground 清理 demo 工具
