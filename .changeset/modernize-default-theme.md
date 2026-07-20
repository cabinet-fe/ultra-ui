---
'@veltra/styles': patch
'@veltra/desktop': patch
---

优化默认主题视觉细节：圆角阶梯从 4/6/8 调整为 6/8/12（对齐 Tailwind rounded-md/lg/xl）；卡片内边距收紧为 8/12/16 并使用 12px 圆角（新增 `--u-card-radius` token）；区分结构边框与控件描边（light 控件描边加深为 `#d4d4d8`，dark 整体提亮），修复 hero 主题 muted 边框透明、glass 主题亮色边框不可见的问题；焦点环统一使用 `--u-focus-ring` token（breadcrumb、condition-editor、rich-text-editor），并修复 button plain/text 变体覆盖焦点环的层叠问题。
