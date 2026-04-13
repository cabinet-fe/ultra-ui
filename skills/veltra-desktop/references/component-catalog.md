# Component Catalog

这份 catalog 来自参考仓库快照，主要作用是帮助你按功能反查组件名、源码模式和 demo 覆盖情况。

## 按功能浏览

### 输入与表单

`auto-complete`, `batch-edit`, `cascade`, `checkbox`, `checkbox-group`, `date-picker`, `date-range-picker`, `file-picker`, `form`, `form-item`, `grid-input`, `group-input`, `input`, `multi-select`, `multi-tree-select`, `number-input`, `number-range-input`, `palette`, `password-input`, `radio`, `radio-group`, `select`, `slider`, `switch`, `table-editor`, `textarea`, `tree-select`

### 数据展示

`badge`, `calendar`, `card`, `empty`, `gantt-chart`, `grid`, `list`, `number`, `progress`, `progress-nodes`, `table`, `tag`, `text`, `theme`, `tree`, `watermark`

### 反馈与浮层

`context-menu`, `dialog`, `drawer`, `dropdown`, `loading`, `message`, `message-confirm`, `notification`, `pop-confirm`, `tip`

### 导航与布局

`action`, `breadcrumb`, `button`, `check-tag`, `float-button`, `icon`, `layout`, `menu`, `paginator`, `scroll`, `steps`, `tabs`

### 编辑器与复杂交互

`code-editor`, `condition-editor`, `expression-editor`, `node-render`, `rich-text-editor`

## 有哪些组件没有独立 demo

当前组件目录存在但 playground 顶层 demo 目录缺失：

- `check-tag`
- `checkbox-group`
- `condition-editor`
- `context-menu`
- `date-panel`
- `form-item`
- `gantt-chart`
- `node-render`
- `password-input`
- `radio-group`
- `rich-text-editor`

这不代表组件不可用，只表示没有对应的顶层示例页。

## 有哪些 demo 名称与组件目录不完全一致

- demo `contextmenu` -> 真实组件目录 `context-menu`
- demo `text-editor` -> 当前更接近 `rich-text-editor` / 旧类型别名语义

## 代表性源码入口

定位常见问题时，优先从这些组件切入：

- 基础按钮模式：`button`
- 表单容器模式：`form`
- 单值表单控件模式：`input`
- 下拉 + 虚拟列表模式：`select`
- 复杂数据视图模式：`table`
- 主题编辑器模式：`theme`
