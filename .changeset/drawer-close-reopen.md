---
"@veltra/desktop": patch
---

修复 `UDrawer` 关闭动画期间再次打开会停在关闭状态的问题：点遮罩、关闭按钮或按 Esc 时 `v-model` 立刻同步为 `false`（原先等到滑出动画结束后才同步），退出动画期间把 `v-model` 再设为 `true` 会取消关闭并重新打开，此时不再误触发 `closed`。
