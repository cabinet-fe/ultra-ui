---
'@veltra/desktop': patch
---

修复 `UFileViewer` PDF 预览在目标内核 Chrome 102 上整页渲染失败：pdfjs 依赖的 `Math.sumPrecise`、`ArrayBuffer.prototype.transferToFixedLength` 与 `Map` / `WeakMap` 的 `getOrInsert` / `getOrInsertComputed` 缺失时按规范补齐。
