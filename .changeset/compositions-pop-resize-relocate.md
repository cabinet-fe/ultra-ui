---
'@veltra/compositions': patch
'@veltra/desktop': patch
---

- 修复浮层（UDropdown / UTip 等）向上弹出时内容高度变化不再紧贴触发器的问题：usePop 监听浮层内容尺寸变化自动重新定位，select 搜索过滤后面板变矮仍保持贴住触发器
