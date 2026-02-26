## Why

Ultra UI 组件库目前缺少富文本编辑器组件。富文本编辑是许多业务场景（公告编辑、内容管理、评论输入等）的核心需求。基于 Lexical 构建，可以获得高性能、可扩展的编辑体验，同时保持与现有组件库一致的 API 风格。项目已引入 `lexical` 依赖，是时候将其封装为标准组件。

## What Changes

- 新增 `URichTextEditor` 组件，位于 `ui/components/rich-text-editor/`
- 支持基础富文本编辑功能：加粗、斜体、下划线、删除线等行内样式
- 支持段落、标题（H1-H6）等块级格式
- 支持有序列表和无序列表
- 支持行内代码和代码块
- 支持引用块（blockquote）
- 支持链接的插入和编辑
- 支持撤销/重做
- 提供工具栏 UI，可自定义显示的功能按钮
- 通过 `v-model` 进行双向数据绑定（HTML string 或 Lexical JSON）
- 支持 `disabled`、`readonly`、`placeholder` 等表单属性
- 集成表单系统（`useFormComponent`、`useFormFallbackProps`）
- 提供 SCSS 主题变量，支持主题定制

## Capabilities

### New Capabilities
- `rich-text-editing`: 基于 Lexical 的核心富文本编辑能力，包括行内样式、块级格式、列表、代码、引用、链接等
- `rich-text-toolbar`: 富文本编辑器工具栏，提供格式化操作按钮和状态同步

### Modified Capabilities
（无）

## Impact

- **新增文件**: `ui/components/rich-text-editor/` 目录下的组件文件（index.ts、rich-text-editor.vue、style.scss、style.ts）及可能的子组件
- **类型定义**: `ui/types/` 下新增 RichTextEditor 相关类型
- **依赖**: 使用已有的 `lexical`、`@lexical/clipboard`、`@lexical/utils`，可能新增 `@lexical/rich-text`、`@lexical/list`、`@lexical/link`、`@lexical/code`、`@lexical/selection`、`@lexical/html` 等 Lexical 子包
- **组件注册**: 需要在 `ui/components/index.ts` 和 `ui/install.ts` 中注册新组件
- **样例页面**: `sample/` 下新增富文本编辑器的演示页面
