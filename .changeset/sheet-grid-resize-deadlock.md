---
'@veltra/sheet': patch
'@veltra/sheet-core': patch
---

- sheet-core: grid 容器 resize 观察改为双层 requestAnimationFrame 延迟量取（等布局稳定），且量到宽或高为 0 时跳过 resize 保留现值——修复报表查看器初次挂载时画布高度被写成 0、容器随之塌陷后 ResizeObserver 不再触发的白屏死锁（此前需手动 window resize 才恢复），并补对应单测
