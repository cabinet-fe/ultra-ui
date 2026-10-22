---
'@veltra/styles': patch
---

- `slide-down` / `slide-up` 与 `zoom-in` 系列离场比入场更快（slide 离场 0.15s、zoom-in 离场 0.12s），高频开合更干脆。
- `zoom-in` 系列缩放起点由 `0.8` 收敛到 `0.9`；`spring` 起点由 `0` 收敛到 `0.9` 并带透明度，出场目标由归零改为 `0.96`，不再从零放大。
- `spring` 在系统开启「减弱动态效果」时只保留透明度过渡，不再缩放。
