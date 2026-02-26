## ADDED Requirements

### Requirement: Toolbar rendering
工具栏 SHALL 根据 `toolbar` prop 配置渲染对应的格式化按钮。

#### Scenario: Default toolbar
- **WHEN** 未提供 toolbar prop
- **THEN** 工具栏 SHALL 显示所有可用的格式化按钮：撤销、重做、分隔符、标题选择、分隔符、加粗、斜体、下划线、删除线、行内代码、分隔符、无序列表、有序列表、分隔符、引用、代码块、分隔符、链接

#### Scenario: Custom toolbar
- **WHEN** toolbar prop 为 `['bold', 'italic', '|', 'heading']`
- **THEN** 工具栏 SHALL 仅显示加粗、斜体、分隔符和标题选择按钮

#### Scenario: Empty toolbar
- **WHEN** toolbar prop 为空数组 `[]`
- **THEN** 工具栏 SHALL 不显示

### Requirement: Toolbar state synchronization
工具栏按钮 SHALL 实时反映当前光标位置的格式状态。

#### Scenario: Bold button active state
- **WHEN** 光标位于加粗文本内
- **THEN** 加粗按钮 SHALL 显示为激活（高亮）状态

#### Scenario: Heading dropdown state
- **WHEN** 光标位于 H2 标题内
- **THEN** 标题下拉框 SHALL 显示当前为 "Heading 2"

#### Scenario: State updates on selection change
- **WHEN** 用户通过点击或键盘移动光标到不同格式的文本
- **THEN** 工具栏所有按钮的激活状态 SHALL 立即更新

### Requirement: Toolbar button interaction
工具栏按钮 SHALL 触发对应的格式化操作。

#### Scenario: Click bold button
- **WHEN** 用户选中文本后点击加粗按钮
- **THEN** SHALL 对选中文本应用加粗格式，焦点 SHALL 保持在编辑器中

#### Scenario: Click button without selection
- **WHEN** 用户未选中文本但光标在编辑器内，点击加粗按钮
- **THEN** 后续输入的文本 SHALL 自动应用加粗格式

### Requirement: Toolbar separator
工具栏 SHALL 支持按钮分组，通过分隔符 `'|'` 实现视觉分隔。

#### Scenario: Render separator
- **WHEN** toolbar 配置中包含 `'|'`
- **THEN** SHALL 在对应位置渲染一个垂直分隔线

### Requirement: Heading selector
工具栏 SHALL 包含标题级别选择器，支持段落和 H1-H6 之间的切换。

#### Scenario: Select heading level
- **WHEN** 用户点击标题选择器并选择 H2
- **THEN** 当前段落 SHALL 转换为 H2 标题

#### Scenario: Display current block type
- **WHEN** 光标位于普通段落内
- **THEN** 标题选择器 SHALL 显示 "正文"

### Requirement: Toolbar disabled state
工具栏 SHALL 响应组件的 disabled 状态。

#### Scenario: All buttons disabled
- **WHEN** 组件处于 disabled 状态
- **THEN** 所有工具栏按钮 SHALL 显示为禁用状态，不可点击

### Requirement: Toolbar hidden in readonly
当组件处于 readonly 模式时，工具栏 SHALL 隐藏。

#### Scenario: Hide toolbar in readonly mode
- **WHEN** 组件的 readonly prop 为 true
- **THEN** 工具栏 SHALL 不渲染
