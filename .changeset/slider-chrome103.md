---
'@veltra/desktop': patch
---

修复 `USlider` 在 Chrome 103 内核宿主上抛出 TypeError、区间滑块拖动失效的问题：内部改为先把偏移量映射为新数组再 `sort`，不再使用 Chrome 110 才支持的 `Array.prototype.toSorted`，行为与取值不变。
