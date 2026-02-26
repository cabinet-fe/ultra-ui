## 1. 依赖与类型定义

- [ ] 1.1 在 `ui/package.json` 中添加所需的 `@lexical/*` 子包依赖（`@lexical/rich-text`、`@lexical/list`、`@lexical/link`、`@lexical/code`、`@lexical/selection`、`@lexical/html`、`@lexical/heading`）
- [ ] 1.2 在 `ui/types/components/` 下创建 `rich-text-editor.ts` 类型定义文件，定义 `RichTextEditorProps`（继承 `FormComponentProps`）、`RichTextEditorEmits`、`RichTextEditorExposed`、`ToolbarItem` 类型、`RichTextFormat` 类型
- [ ] 1.3 在 `ui/types/components/index.ts` 中导出新类型

## 2. 核心编辑器组件

- [ ] 2.1 创建 `ui/components/rich-text-editor/` 目录结构（index.ts、rich-text-editor.vue、toolbar.vue、style.scss、style.ts）
- [ ] 2.2 实现 `rich-text-editor.vue` 主组件：初始化 Lexical editor 实例、注册必要的节点（HeadingNode、ListNode、ListItemNode、LinkNode、CodeNode、CodeHighlightNode、QuoteNode）和插件（RichTextPlugin、ListPlugin、LinkPlugin、HistoryPlugin）
- [ ] 2.3 实现 v-model 双向绑定：通过 `registerUpdateListener` 监听编辑器变更并更新 modelValue，通过 watch 监听 modelValue 外部变更并同步到编辑器（包含 composing 检查防止循环更新）
- [ ] 2.4 实现 HTML / JSON 双格式支持：使用 `@lexical/html` 的 `$generateHtmlFromNodes` 和 `$generateNodesFromDOM` 进行 HTML 序列化，使用 `editor.getEditorState().toJSON()` / `editor.parseEditorState()` 进行 JSON 序列化
- [ ] 2.5 实现 placeholder 功能：在编辑器内容为空时显示 placeholder 文本
- [ ] 2.6 实现表单集成：通过 `useFormComponent` 和 `useFormFallbackProps` 继承 disabled、readonly、size 状态
- [ ] 2.7 实现组件卸载时的资源清理（销毁 editor 实例）

## 3. 工具栏组件

- [ ] 3.1 实现 `toolbar.vue` 子组件：根据 toolbar prop 渲染格式化按钮，支持分隔符 `'|'`
- [ ] 3.2 实现行内格式按钮（bold、italic、underline、strikethrough、code），点击后通过 Lexical 命令切换对应格式
- [ ] 3.3 实现标题选择器下拉：支持正文和 H1-H6 切换
- [ ] 3.4 实现列表按钮（有序列表、无序列表），通过 `@lexical/list` 的 INSERT_ORDERED_LIST_COMMAND / INSERT_UNORDERED_LIST_COMMAND 实现
- [ ] 3.5 实现引用和代码块按钮
- [ ] 3.6 实现链接按钮：弹出链接输入/编辑浮层
- [ ] 3.7 实现撤销/重做按钮
- [ ] 3.8 实现工具栏状态同步：通过 `registerUpdateListener` 监听选区和格式变化，实时更新按钮激活状态
- [ ] 3.9 实现工具栏的 disabled 状态和 readonly 模式下的隐藏逻辑

## 4. 样式

- [ ] 4.1 编写 `style.scss`：使用项目 BEM mixins 定义编辑器容器样式、尺寸变体、disabled/readonly 状态样式
- [ ] 4.2 定义工具栏样式：按钮布局、分隔符、hover/active 状态、禁用状态
- [ ] 4.3 定义编辑器内容区域的样式：标题、列表、引用、代码块、链接等内容元素的排版和主题
- [ ] 4.4 编写 `style.ts` 导入 SCSS

## 5. 组件注册与导出

- [ ] 5.1 在 `ui/components/rich-text-editor/index.ts` 中导出 `URichTextEditor`
- [ ] 5.2 在 `ui/components/index.ts` 中添加 rich-text-editor 的导出
- [ ] 5.3 在 `ui/install.ts` 中注册 `URichTextEditor` 组件
