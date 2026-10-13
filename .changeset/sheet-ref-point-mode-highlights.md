---
"@veltra/sheet": patch
---

feat(sheet): 公式引用拾取对齐 Excel Point mode——拾取会话中点击画布任意格替换上次插入的引用且编辑不中断（此前会失焦提交残缺公式），shift+点选扩展与普通点选同路径替换（`A1` → 点 `C5` 变 `C5`，shift 点 `C5` 变 `A1:C5`）；点选被编辑格自身忽略（防循环引用）。新增画布引用染色框：编辑公式时按文本扫描逐引用上框（蓝/绿/红按出现顺序循环），手输/拾取/替换实时跟随、提交即清除（引擎 `SheetGrid.setHighlightRanges` 通道 + `scanFormulaReferences`）。依赖引擎 infinitable 0.2.1
