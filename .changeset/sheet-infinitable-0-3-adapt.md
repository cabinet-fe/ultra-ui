---
'@veltra/sheet': patch
---

更新 `infinitable` 依赖至 `^0.3.4`，并适配 0.3 破坏性变更：`SelectionModel` 移除 `clear()`，测试改用 `restoreState({ activeCell: null, ranges: [] })` 置空选区。
