---
'@veltra/desktop': patch
---

富文本编辑器图片支持选中与缩放编辑（参考 Lexical playground / Tiptap 交互）：点击图片显示选中描边与右下角缩放手柄，拖拽等比调整尺寸，Esc 取消选中，Backspace / Delete 删除选中图片。尺寸持久化到节点并随 HTML 序列化输出 `width` / `height` 属性，回显时保留；`disabled` / `readonly` 下不出现交互。
