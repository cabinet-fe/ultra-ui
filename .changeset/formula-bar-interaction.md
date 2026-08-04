---
'@veltra/sheet': minor
---

fx 公式栏交互基础版：函数补全 + 画布引用选择。

- `FormulaFunctionMeta` / `listFormulaFunctions()`；13 个内置函数补全 meta（params + 中文说明）
- fx 输入 `=` 弹出候选（前缀过滤上限 10；↑↓ / Tab / Enter / 点击 → `NAME(`）
- 引用选择模式：运算符/`(`/`,` 后点选/拖选插入 `A1` / `A1:B2`；blur 抑制防误提交
- Esc 分层：先关候选再取消编辑；镜像只读期不弹补全
