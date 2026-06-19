---
"@veltra/desktop": patch
---

- ULoading: 重构加载类型枚举为 `dual-ring` / `dot` / `ring` / `bars`，默认值改为 `dual-ring`（breaking：移除 `classic` / `line` / `spinner` / `morph`）
- UDualNav: 左轨应用项增加 tooltip 展示描述、`selected` 选中态样式，并接入 ripple 指令
