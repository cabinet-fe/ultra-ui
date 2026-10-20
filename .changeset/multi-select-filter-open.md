---
"@veltra/desktop": patch
---

修复 `UMultiSelect` 开启 `filterable` 时，模态弹框打开把焦点移入过滤输入框会连带展开下拉面板的问题：现在仅在键入过滤词时展开面板，点击输入框展开的行为不变。
