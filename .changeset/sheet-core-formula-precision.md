---
"@veltra/sheet-core": patch
---

- 公式引擎：四则运算（`+` `-` `*` `/`）与 `SUM` / `AVERAGE` / `ROUND` / `ABS` 改走 `@cat-kit/core` 的 `$n` 高精度计算，规避浮点累加与除法误差
- `ROUND` 负位数入参改为先缩放到整数再取整，与正位数行为对齐
- 新增 `@cat-kit/core`（`>=1.2.1`）为 peerDependency
