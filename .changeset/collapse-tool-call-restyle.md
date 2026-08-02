---
'@veltra/desktop': patch
'@veltra/ai': patch
'@veltra/styles': patch
---

UCollapse 视觉改为边框卡片风格（对齐 AI tool-call），默认展开图标改为 ArrowDown 并旋转 180°；移除 collapse 专用 mix/theme token。`UCollapseItem` 支持独立 `v-model`；`UAiChat` tool-call 卡片直接复用独立 `UCollapseItem`，去掉重复的卡片壳与 chevron 样式。
