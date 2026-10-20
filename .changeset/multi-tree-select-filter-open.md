---
"@veltra/desktop": patch
---

修复 `UMultiTreeSelect` 开启 `filterable` 时，模态弹框打开把焦点移入过滤输入框会连带展开下拉面板的问题；并修复面板懒渲染导致键入的首字符过滤条件丢失的问题，展开后会补一次过滤。
