---
'@veltra/styles': patch
---

修正 `sideEffects` 声明，避免 normalize/transitions 等按需样式在打包时被 tree-shake 掉。
