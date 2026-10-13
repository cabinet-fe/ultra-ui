---
"@veltra/sheet": patch
---

feat(sheet): 函数参数格支持 shift+点选批量扩展——引用拾取期点选后按住 shift 点击其它格，上次插入的引用被替换为「首次拾取锚点 → 点击格」的范围（A1 → shift 点 C5 → A1:C5，可连续扩展）；输入任意字符即结束延续。依赖引擎 infinitable 0.2.0（`resolveShiftSelectAnchor` 锚点 hook 与 `SelectionInterceptMeta` 回交元信息）

fix(sheet): 修复单元格嵌入图替换或移除后再嵌入始终显示第一张图（引擎 `refreshImageCell` 换 URL / 移除时同步失效 cell 级位图缓存）
