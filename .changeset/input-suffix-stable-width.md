---
'@veltra/desktop': patch
---

- desktop: `u-input` 悬停出现清除图标时宽度跳动修复——`clearable` 时后缀容器恒渲染占位（复用既有 `min-width: 20px`），清除图标仍走 `zoom-in` 过渡，自定义 `#suffix` 表现不变；`clearable=false` 且无后缀内容时依旧不渲染后缀。补对应单测
