## Context

Ultra UI 是一个 Vue 3 组件库，目前包含 60+ 组件。项目已有基于 CodeMirror 的 `UCodeEditor` 组件作为代码编辑的解决方案，现在需要新增面向富文本场景的 `URichTextEditor` 组件。项目已引入 `lexical@^0.40.0` 及 `@lexical/clipboard`、`@lexical/utils` 依赖。

现有组件结构约定：每个组件目录包含 `index.ts`（导出）、`<name>.vue`（主组件）、`style.scss`（样式）、`style.ts`（样式入口）。类型定义位于 `ui/types/components/` 下，遵循 `FormComponentProps` 继承模式。

## Goals / Non-Goals

**Goals:**
- 提供开箱即用的富文本编辑器组件，支持常见富文本格式（标题、行内样式、列表、代码、引用、链接）
- 遵循 Ultra UI 现有组件架构和 API 风格（v-model、size、disabled、readonly 等）
- 与表单系统（`useFormComponent`、`useFormFallbackProps`）无缝集成
- 工具栏可配置，用户可按需选择显示的功能按钮
- 支持 HTML string 和 Lexical EditorState JSON 两种数据格式

**Non-Goals:**
- 不实现图片/视频上传（后续迭代）
- 不实现表格编辑（后续迭代）
- 不实现协同编辑
- 不实现 Markdown 快捷输入（后续迭代）
- 不提供自定义 Lexical 节点的扩展 API（首版聚焦内置特性）

## Decisions

### 1. 基于 Lexical 而非 ProseMirror / Tiptap

**选择**: Lexical

**理由**: 项目已引入 lexical 依赖；Lexical 框架无关，适合直接封装为 Vue 组件；包体积小且性能优异；Meta 开源项目，社区活跃。

**排除**: ProseMirror 需要更多胶水代码；Tiptap 引入额外的抽象层和依赖。

### 2. 组件拆分策略

**选择**: 主组件 + 工具栏子组件

- `rich-text-editor.vue` — 主组件，管理 Lexical editor 实例、数据绑定
- `toolbar.vue` — 工具栏子组件，渲染格式化按钮、监听编辑器状态

**理由**: 参考 `UCodeEditor` 的单文件结构但考虑到富文本编辑器工具栏复杂度较高，将工具栏拆分为独立子组件可保持代码清晰。工具栏不对外独立导出，仅作为内部子组件使用。

### 3. 数据格式与 v-model

**选择**: 默认使用 HTML string 作为 `v-model` 值，通过 `format` prop 支持切换为 Lexical JSON。

**理由**: HTML string 是最通用的富文本数据格式，方便存储和渲染；JSON 格式适合需要精确状态恢复的高级场景。使用 `@lexical/html` 进行 HTML 序列化/反序列化。

### 4. 工具栏配置方式

**选择**: 通过 `toolbar` prop 传入功能项数组，如 `['bold', 'italic', 'heading', 'list']`。

**理由**: 简洁直观，和行业常见做法一致。提供默认的全量工具栏配置，用户可按需裁减。通过分隔符 `'|'` 支持按钮分组。

### 5. Lexical 插件/节点注册

**选择**: 根据 `toolbar` 配置按需注册 Lexical 节点和插件，使用动态 import 避免未使用功能的代码被打包。

**理由**: 遵循 Lexical 的插件化架构；按需加载减少包体积；参考 `UCodeEditor` 的语言 loader 模式。

### 6. 样式方案

**选择**: SCSS + BEM，使用项目现有的 mixins 和 CSS 变量系统。

**理由**: 与所有现有组件保持一致。编辑器内部的内容样式通过 scoped 样式 + Lexical 的 theme 配置实现。

## Risks / Trade-offs

- **Lexical 子包数量多** → 需要新增多个 `@lexical/*` 依赖（rich-text、list、link、code、html、selection、heading）。通过在 `package.json` 中统一管理版本来缓解。
- **HTML 序列化精度** → Lexical 内部状态与 HTML 之间的转换可能存在信息损失。在 JSON 格式下可完全保留状态。文档中明确说明两种格式的适用场景。
- **工具栏状态同步** → 光标位置变化时需要实时更新工具栏按钮的激活状态，频繁的 DOM 查询可能影响性能。使用 Lexical 的 `registerUpdateListener` 和选区变更监听来高效同步。
- **外部 v-model 同步** → 类似 `UCodeEditor` 需要处理外部值变更与编辑器内部状态的双向同步，需避免循环更新。参考 `UCodeEditor` 的 dispatch + composing 检查模式。
