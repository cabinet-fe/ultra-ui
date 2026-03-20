# 重构 Theme 主题配置组件

> 状态: 已执行

## 目标

重构 `ui/components/theme` 组件，使其能够完整配置 `Theme` 定义中的全部 CSS 变量相关字段，提供更清晰、紧凑且美观的主题编辑体验，并保留实时预览、重置与导出能力。

## 内容

1. 梳理 `Theme` 结构与现有 `theme` 组件实现，补齐当前缺失的主题字段，抽象适合渲染全部主题项的数据结构与辅助逻辑，避免继续手写大段重复表单。
2. 重写 `theme` 组件界面与交互，在当前组件库风格下提供紧凑、美观、易用的主题配置面板，包括概览区、分组导航、搜索/筛选、分组编辑区与必要的字段说明。
3. 完善主题编辑能力与状态管理，确保编辑基于可重置的主题副本，修改可实时应用到页面，支持一键恢复默认主题与导出当前主题配置。
4. 运行类型检查与相关测试/构建验证，修复发现的问题；验证通过后更新计划状态并记录实际影响文件。

## 影响范围

- `sample/src/theme/index.vue`
- `sample/App.vue`
- `ui/components/theme/theme.vue`
- `ui/components/theme/style.scss`
- `ui/components/theme/style.ts`
- `ui/components/theme/schema.ts`
- `ui/types/components/theme.ts`

## 历史补丁

- patch-1: 补充 Theme 独立示例页
- patch-2: 增强 Theme 配置入口可发现性
- patch-3: 强化 Theme Studio 可视化入口与工作台引导
- patch-4: 简化配置UI与修复滚动失效
