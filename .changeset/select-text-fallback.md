---
'@veltra/desktop': patch
---

选择类组件支持 `text` 兜底文案：`u-select` / `u-tree-select` / `u-cascade` 的 `modelValue` 未命中选项时（如回显数据对应的选项已被删除），展示 `text` 属性文案，避免露出不可读的编码。`update:text`（`u-select` / `u-tree-select`）规则：命中时发出 label、清空时发出 `undefined`；未命中且传了 `text` 时不发出（父级文案即事实来源），未传 `text` 时发出 `undefined`（与旧行为一致）；`readonly` 下一律不发出。`u-select` / `u-tree-select` 可直接 `v-model:text` 绑定冗余字段。
