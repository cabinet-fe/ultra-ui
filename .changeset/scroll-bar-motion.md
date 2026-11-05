---
'@veltra/styles': patch
'@veltra/desktop': patch
'@veltra/mobile': patch
'@veltra/ai': patch
---

放缓入场缓动曲线，恢复 150ms 级微交互的可感知过程。

- 主题 `transition.easeOut` 由 `cubic-bezier(0.23, 1, 0.32, 1)` 改为 `cubic-bezier(0.33, 1, 0.68, 1)`。原曲线在 15ms 就走完 40%、75ms 走完 97%，150ms 级的过渡几乎是一帧闪出；新曲线前段仍快，但整个过程可见。
- `fade-scale`、`slide-down` / `slide-up`、`zoom-in` 系列、`UTag`、`UMTag`、`UTip`、AI 对话面板与 `UDialog` 最大化翻转里写死的同一条曲线同步替换，避免主题 token 与局部硬编码分叉。
- `UScroll` 滚动条出现/隐藏时长由 `fast`（0.15s）改为 `normal`（0.25s）；悬停变宽保持 `fast`，但曲线随主题更新，不再瞬移。
