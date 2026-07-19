---
'@veltra/styles': minor
'@veltra/desktop': minor
---

设计系统默认视觉焕新与暗色修复

- 默认 light/dark 主题重新调色：中性冷灰阶 + 精制语义色；暗色阴影由白色系改为黑色系
- 新增阴影分级 token（`--u-shadow-sm` / `--u-shadow-lg`）、动效 token（`--u-transition-fast/normal/slow`、`--u-transition-ease(-out)`）、统一焦点环 `--u-focus-ring` 与卡片内边距 `--u-card-padding-*`
- 按钮默认圆角由胶囊（9999px）改为 radius token；卡片默认 16px 内边距 + 细边框 + 柔和阴影；输入框水平内边距加大并补焦点环
- checkbox/radio/switch 原生输入改为视觉隐藏但可聚焦，核心控件统一补齐键盘 `:focus-visible` 指示；slider thumb 可聚焦并补 hover
- 浮层（dialog/drawer/dropdown/notification/tip/message 等）阴影统一迁移到 `--u-shadow-lg`
- 修复暗色破版点：text/tabs/nav/group-nav/contextmenu/scroll/code-editor 等硬编码颜色改为 token 派生；组件级 token（nav、table）去硬编码以跟随自定义主题
- 修复 rich-text-editor 无效的 `rgba(var)` focus ring 声明；修复非 hex 主题值（rgba）生成 `NaN` CSS 变量声明的问题
