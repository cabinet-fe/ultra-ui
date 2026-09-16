---
'@veltra/desktop': patch
'@veltra/styles': patch
---

- 表单（Form）与表格编辑器（TableEditor）：校验失败的输入类控件聚焦光晕统一转红，新增 `--u-focus-ring-danger` 组件 token（亮色取 `--u-color-danger-a-28`、暗色 `-a-35`，几何与 `--u-focus-ring` 一致）
- 错误态下描边恒为 danger 色：显式压住控件 `:hover` 的 primary 描边（原按源序分胜负，悬浮错误控件时描边会回蓝）
- 按钮（Button）：带有 type 的 text 变体支持波纹效果

