---
"@veltra/desktop": patch
---

修复 Tree `disabledNode` 在节点 `children` 未挂载时调用的问题，改为整棵树构建完成后再判定 disabled
