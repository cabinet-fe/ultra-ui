---
'@veltra/desktop': patch
---

`UCarousel` 开启 `autoplay` 时，指针悬停在轮播上暂停自动播放，移开后恢复；恢复时按完整 `interval` 重新计时，不会在移开瞬间立即切换。
