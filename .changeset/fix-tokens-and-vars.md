---
"@veltra/desktop": patch
"@veltra/styles": patch
"@veltra/sheet": patch
"@veltra/ai": patch
---

修复 Select 等组件样式变量绑定错误与非标 Token：
- Select / AutoComplete / Contextmenu 修复选项误绑 `--u-nav-*` 侧栏变量的问题，补充对应组件级外观 token 并适配明暗对比度
- 纠正 Card / DualNav / Breadcrumb / ProgressNodes / ConditionEditor / ExpressionEditor / RichTextEditor 等多处非标与缺失 token 引用
- 统一修正 `text-color, secondary` 为规范 token `text-color, second`
