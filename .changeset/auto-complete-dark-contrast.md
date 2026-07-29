---
'@veltra/desktop': patch
---

修复 AutoComplete 下拉选项在暗色主题下高亮/选中态对比度严重不足（文字不可读）的问题，交互态颜色改用随主题适配的 `--u-nav-hover-*` / `--u-nav-active-*` 变量；同时修复手动关闭面板后再次输入时下拉面板不重新展开的问题。
