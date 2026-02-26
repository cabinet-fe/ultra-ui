## ADDED Requirements

### Requirement: Editor initialization
组件 SHALL 在挂载时创建 Lexical editor 实例，并将其渲染到组件内部的容器元素中。

#### Scenario: Component mounts with empty value
- **WHEN** 组件挂载且未提供 modelValue
- **THEN** 编辑器 SHALL 显示空内容，并展示 placeholder 文本（如果提供了 placeholder prop）

#### Scenario: Component mounts with initial HTML value
- **WHEN** 组件挂载且 modelValue 为 HTML string
- **THEN** 编辑器 SHALL 解析 HTML 并正确渲染富文本内容

#### Scenario: Component mounts with initial JSON value
- **WHEN** 组件挂载且 format 为 'json'，modelValue 为 Lexical EditorState JSON
- **THEN** 编辑器 SHALL 从 JSON 恢复编辑器状态

### Requirement: Inline formatting
组件 SHALL 支持以下行内样式：加粗（bold）、斜体（italic）、下划线（underline）、删除线（strikethrough）、行内代码（code）。

#### Scenario: Apply bold formatting
- **WHEN** 用户选中文本并触发加粗操作
- **THEN** 选中文本 SHALL 变为加粗样式，编辑器状态同步更新

#### Scenario: Toggle formatting off
- **WHEN** 用户选中已加粗的文本并再次触发加粗操作
- **THEN** 选中文本的加粗样式 SHALL 被移除

#### Scenario: Apply multiple inline formats
- **WHEN** 用户对同一段文本先后应用加粗和斜体
- **THEN** 文本 SHALL 同时显示加粗和斜体样式

### Requirement: Block formatting
组件 SHALL 支持以下块级格式：段落（paragraph）、标题（H1-H6）、引用块（blockquote）、代码块（code block）。

#### Scenario: Convert paragraph to heading
- **WHEN** 用户将光标定位在段落内并选择 H1
- **THEN** 该段落 SHALL 转换为 H1 标题

#### Scenario: Convert heading back to paragraph
- **WHEN** 用户将光标定位在标题内并选择段落格式
- **THEN** 该标题 SHALL 转换为普通段落

#### Scenario: Create blockquote
- **WHEN** 用户将光标定位在段落内并触发引用操作
- **THEN** 该段落 SHALL 转换为引用块，显示引用样式

#### Scenario: Create code block
- **WHEN** 用户触发代码块操作
- **THEN** SHALL 创建代码块节点，内容以等宽字体显示

### Requirement: List support
组件 SHALL 支持有序列表和无序列表。

#### Scenario: Create unordered list
- **WHEN** 用户触发无序列表操作
- **THEN** 当前段落 SHALL 转换为无序列表项

#### Scenario: Create ordered list
- **WHEN** 用户触发有序列表操作
- **THEN** 当前段落 SHALL 转换为有序列表项，并显示序号

#### Scenario: Nested list
- **WHEN** 用户在列表项内按 Tab 键
- **THEN** 列表项 SHALL 缩进一级，形成嵌套列表

### Requirement: Link support
组件 SHALL 支持插入和编辑超链接。

#### Scenario: Insert link
- **WHEN** 用户选中文本并触发插入链接操作，输入 URL
- **THEN** 选中文本 SHALL 转换为超链接，href 指向输入的 URL

#### Scenario: Edit existing link
- **WHEN** 用户点击已有链接
- **THEN** SHALL 显示链接编辑浮层，允许修改 URL 或移除链接

### Requirement: Data binding via v-model
组件 SHALL 通过 v-model 支持双向数据绑定。

#### Scenario: Editor content changes update modelValue
- **WHEN** 用户在编辑器中输入或修改内容
- **THEN** modelValue SHALL 同步更新为当前内容（HTML string 或 JSON，取决于 format prop）

#### Scenario: External modelValue change updates editor
- **WHEN** 外部代码修改 modelValue
- **THEN** 编辑器内容 SHALL 同步更新，且不触发多余的 update 事件

#### Scenario: Avoid circular updates
- **WHEN** 编辑器正在 composing（输入法组合输入中）
- **THEN** 外部设置 modelValue SHALL 不中断正在进行的 composing

### Requirement: Undo and redo
组件 SHALL 支持撤销和重做操作。

#### Scenario: Undo last action
- **WHEN** 用户触发撤销操作（Ctrl+Z 或工具栏按钮）
- **THEN** 编辑器 SHALL 恢复到上一个状态

#### Scenario: Redo after undo
- **WHEN** 用户在撤销后触发重做操作（Ctrl+Y / Ctrl+Shift+Z 或工具栏按钮）
- **THEN** 编辑器 SHALL 恢复到撤销前的状态

### Requirement: Form integration
组件 SHALL 集成 Ultra UI 的表单系统。

#### Scenario: Disabled state
- **WHEN** disabled prop 为 true 或从表单继承 disabled 状态
- **THEN** 编辑器 SHALL 不可编辑，工具栏按钮 SHALL 全部禁用，显示禁用样式

#### Scenario: Readonly state
- **WHEN** readonly prop 为 true
- **THEN** 编辑器内容 SHALL 不可修改，但可以选中和复制文本，工具栏 SHALL 隐藏

#### Scenario: Size inheritance
- **WHEN** 在 UForm 内使用且 form 设置了 size
- **THEN** 编辑器 SHALL 继承 form 的 size 设定

### Requirement: Placeholder
组件 SHALL 在空内容时显示 placeholder 文本。

#### Scenario: Show placeholder when empty
- **WHEN** 编辑器内容为空
- **THEN** SHALL 显示 placeholder prop 指定的文本，样式为灰色提示文字

#### Scenario: Hide placeholder on input
- **WHEN** 用户开始输入内容
- **THEN** placeholder 文本 SHALL 消失

### Requirement: Component cleanup
组件 SHALL 在卸载时正确释放资源。

#### Scenario: Unmount cleanup
- **WHEN** 组件从 DOM 中卸载
- **THEN** Lexical editor 实例 SHALL 被销毁，所有事件监听 SHALL 被移除
