---
'@veltra/ai': patch
---

UAiChat：工具卡片与思考过程默认折叠（思考中折叠头部右侧滚动展示最新一行思考）；待确认、有内联 render/插槽的进行中调用与 terminal 答复工具仍自动展开；`autoCollapse` 缺省规则改为一律 `true`（terminal 终结工具缺省 `false`）。消息列表滚动条不再常驻；上翻时的回底入口移至列表下方并改为纯向下箭头按钮。`UAiOrb` 不再作为公共组件导出（无外部使用方，按 patch 处理）。
