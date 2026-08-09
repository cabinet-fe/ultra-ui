Status: pending

# 09 — 条件样式规则编辑器重做

**What to build:**
替换 420px 的 `conditional-rules-dialog.vue`，重做为大尺寸（~680px）规则编辑器：

- 规则列表每行**可编辑**：运算符补全 `between` / `contains`；值控件按运算符与字段类型自适应（between → 双 `UNumberInput`；eq/contains → 文本或数字）
- 样式配置扩展：背景色 + 字体色（`UPalette`）+ 加粗/斜体 toggle
- 行内编辑、删除、拖拽排序（数组顺序 = 求值优先级）、行尾效果预览块
- 求值语义本期仅对绑定格自身值求值；跨字段整行高亮记入后续 issue
- 颜色输入一律 `UPalette`，禁止文本填 hex

**Blocked by:** None — can start immediately.

- [ ] 重做条件样式规则编辑器（680px，可编辑规则行）
- [ ] 运算符/值控件/样式项完整化 + 效果预览
- [ ] 规则排序（上移/下移或拖拽）
- [ ] 更新 rules 测试（如有 UI 相关）
