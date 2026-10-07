---
'@veltra/sheet-core': patch
---

- sheet-core: grid 容器滚轮接线改为「确实消费了滚动才 `preventDefault`」——`scrollBy` 前后滚动位置无变化（视口 == 内容的宿主布局，或已滚到该轴边缘）时不吞事件，wheel 沿滚动链冒泡给祖先原生滚动容器。修复宿主把 grid 定为内容全量像素尺寸时（如报表查看器），外层 `overflow:auto` 滚动容器永远收不到滚轮的问题，并补对应单测
