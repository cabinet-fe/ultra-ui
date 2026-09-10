---
title: Ultra UI 总览
description: Ultra UI（@veltra/*）是面向 Vue 3 的组件与能力库，包含 78 篇桌面组件文档、AI 对话（UAiChat / useChat）、电子表格（USheet / Workbook）、组合式函数、utils 工具、指令、主题系统与按需导入解析器；本篇是全部 124 篇文档的路由表。
aliases: [ultra-ui, veltra, UltraUI, 组件库总览, 文档索引]
keywords: ["@veltra/desktop", "@veltra/ai", "@veltra/sheet", "@veltra/sheet-core", "@veltra/compositions", "@veltra/utils", "@veltra/directives", "@veltra/icons", "@veltra/styles", "@veltra/vite", Vue 3, 组件库, 安装, 模块列表, loadTheme, VeltraUIResolver, "@vitejs/plugin-vue-jsx", 样式副作用, 图标清单]
---

# Ultra UI 总览

Ultra UI（npm 作用域 `@veltra/*`）是面向 Vue 3 的组件与能力库：组件从 `@veltra/desktop` 导入，AI 对话用 `@veltra/ai`，电子表格用 `@veltra/sheet`（模型层 `@veltra/sheet-core`），icons / compositions / utils / directives / styles 分包提供，`@veltra/vite` 提供按需导入解析器。硬规则：入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色；组件样式是独立入口，走 resolver 的模板组件自动带样式，显式 import 的组件（`h()` / render / TSX 里用的）必须自己补 `import '@veltra/desktop/components/<目录>/style'`。运行时要求 Vue `>=3.5.42`；当前组件包版本 `@veltra/desktop@1.7.11`。

## 安装

```bash
bun add @veltra/desktop @veltra/styles @veltra/utils @veltra/compositions @veltra/directives @veltra/icons @cat-kit/core @cat-kit/fe
# 按需加：bun add @veltra/ai ｜ bun add @veltra/sheet @veltra/sheet-core
# 按需自动导入：bun add -D @veltra/vite unplugin-vue-components
# 写 <script lang="tsx"> 或 .tsx：bun add -D @vitejs/plugin-vue-jsx
```

最小入口初始化（与 `guide/installation.md` 一致）：

```ts
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import '@veltra/styles/normalize'
import { loadTheme } from '@veltra/styles/theme'

loadTheme() // 必须调用，否则 --u-* token 为空、组件无颜色

createApp(App).mount('#app')
```

组件注册三选一：全量 `app.use(UltraUI)`（`import UltraUI from '@veltra/desktop/install'`）、SFC 内显式 import + 对应 `style` 子路径、或 `VeltraUIResolver` 按需自动导入（`vite/veltra-ui-resolver.md`）。用 resolver 时模板组件禁止再显式 import：显式 import 会让 resolver 既不注入组件 import 也不注入样式副作用；`h()` / render / JSX 里的组件必须显式 import 并补样式。完整步骤与验证见 `guide/installation.md`。

## 模块速查

### 指南与公共入口

| 模块 | 用途 | 文档路径 |
| --- | --- | --- |
| 安装与初始化 | 安装 peer 依赖、入口 normalize + loadTheme、三种注册方式、TSX 的 `@vitejs/plugin-vue-jsx`、模板与渲染函数混用规则、SCSS 配置与验证 | `guide/installation.md` |
| 图标库 | `@veltra/icons/normal` / `@veltra/icons/colorful` 导入、两个集合 217 个导出名（根入口可导入 216 个）的完整清单与检索、PascalCase / kebab 命名、无 props 组件的尺寸与着色规则 | `icons.md` |
| VeltraUIResolver | unplugin-vue-components 按需自动导入解析器，自动带组件样式副作用；显式 import 与 JSX / 渲染函数不在解析范围 | `vite/veltra-ui-resolver.md` |

### desktop 组件（@veltra/desktop）

| 模块 | 用途 | 文档路径 |
| --- | --- | --- |
| UAction / UActionGroup | 操作按钮组：紧凑的行内操作集合 | `desktop/action.md` |
| UAutoComplete | 自动补全输入框：输入时下拉匹配候选项 | `desktop/auto-complete.md` |
| UBadge | 徽标：元素角标计数与状态点 | `desktop/badge.md` |
| UBatchEdit | 批量编辑：多字段批量赋值的编辑面板 | `desktop/batch-edit.md` |
| UBreadcrumb | 面包屑：层级路径导航 | `desktop/breadcrumb.md` |
| UButton / UButtonGroup | 按钮：type / size / plain / disabled 等形态与按钮组 | `desktop/button.md` |
| UCalendar | 日历：月视图日期面板与日期选择 | `desktop/calendar.md` |
| UCard 系列 | 卡片：UCard / UCardHeader / UCardCover / UCardContent / UCardAction 内容容器 | `desktop/card.md` |
| UCascade | 级联选择器：多级选项逐级下拉选择 | `desktop/cascade.md` |
| UCheckTag | 可选中标签：标签形态的勾选项 | `desktop/check-tag.md` |
| UCheckbox / UCheckboxButton | 复选框：单勾选与按钮形态 | `desktop/checkbox.md` |
| UCheckboxGroup | 复选框组：多选值绑定与全选 | `desktop/checkbox-group.md` |
| UCodeEditor | 代码编辑器：CodeMirror 封装，多语言高亮 | `desktop/code-editor.md` |
| UCollapse / UCollapseItem | 折叠面板：分组展开收起 | `desktop/collapse.md` |
| UConditionEditor | 条件编辑器：可视化组合查询条件 | `desktop/condition-editor.md` |
| UContextmenu | 右键菜单：自定义右键菜单项 | `desktop/contextmenu.md` |
| UDatePanel | 日期面板：平铺的日期选择面板 | `desktop/date-panel.md` |
| UDatePicker | 日期选择器：弹层日期选择输入框 | `desktop/date-picker.md` |
| UDateRangePicker | 日期范围选择器：起止日期选择 | `desktop/date-range-picker.md` |
| UDialog | 对话框：模态弹窗，v-model 控制显隐，#footer 放操作按钮 | `desktop/dialog.md` |
| UDrawer | 抽屉：四方向滑出面板，固定 320px 尺寸 | `desktop/drawer.md` |
| UDropdown | 下拉菜单：触发器弹出菜单项 | `desktop/dropdown.md` |
| UDualNav | 双栏导航：左轨应用 + 右栏子菜单的两层导航，currentPath 受控 | `desktop/dual-nav.md` |
| UEmpty | 空状态：无数据占位插画与文案 | `desktop/empty.md` |
| UExpressionEditor | 表达式编辑器：字段与函数的表达式输入 | `desktop/expression-editor.md` |
| UFilePicker | 文件选择器：本地文件选择上传 | `desktop/file-picker.md` |
| UFileViewer | 文件查看器：docx / pdf 等文件在线预览 | `desktop/file-viewer.md` |
| UFloatButton | 浮动按钮：悬浮固定位置的操作按钮 | `desktop/float-button.md` |
| UForm | 表单容器：拦截 field 控件自动生成表单项，校验 / 联动 / showModified / reset | `desktop/form.md` |
| UFormItem | 表单项：单字段 label / rules / tips / span 容器与 ValidateRule 校验规则 | `desktop/form-item.md` |
| UGanttChart | 甘特图：任务时间轴条状图 | `desktop/gantt-chart.md` |
| UGrid / UGridItem | 栅格布局：24 栅格响应式分栏 | `desktop/grid.md` |
| UGridInput | 网格输入框：网格状多格输入（如验证码） | `desktop/grid-input.md` |
| UGroupInput | 分组输入：前后置附件的组合输入框 | `desktop/group-input.md` |
| UGroupNav | 分组导航：分组标题 + 一层叶子的扁平导航 | `desktop/group-nav.md` |
| UIcon | 图标：渲染 @veltra/icons 图标组件 | `desktop/icon.md` |
| UImageCropper | 图片裁剪：交互式裁剪区域选择 | `desktop/image-cropper.md` |
| UInput | 输入框：文本输入，支持前后缀与清空 | `desktop/input.md` |
| UKbd | 键盘按键：快捷键按键样式展示 | `desktop/kbd.md` |
| ULayout | 布局：CSS Grid 分栏容器，cols / rows / resizable 拖拽调宽 | `desktop/layout.md` |
| UList / UListItem | 列表：条目列表容器 | `desktop/list.md` |
| ULoading / vLoading | 加载：四种加载动画组件与元素级加载遮罩指令 | `desktop/loading.md` |
| message / UMessage | 全局消息：页面顶部自动消失的轻提示，success / warn / info / error | `desktop/message.md` |
| messageConfirm / UMessageConfirm | 确认框：函数式阻断确认，onClosed 以 Promise 返回 confirm / cancel | `desktop/message-confirm.md` |
| UMultiSelect | 多选选择器：多选下拉与标签回显 | `desktop/multi-select.md` |
| UMultiTreeSelect | 多选树选择器：树形结构多选 | `desktop/multi-tree-select.md` |
| UNav | 侧边导航：不限层级多级菜单 | `desktop/nav.md` |
| UNodeRender | 节点渲染：VNode / 字符串 / 函数多形态渲染器 | `desktop/node-render.md` |
| notification / UNotification | 通知：四角堆叠通知条，操作按钮与悬停暂停 | `desktop/notification.md` |
| UNumber | 数字：数值的动画展示与格式化 | `desktop/number.md` |
| UNumberInput | 数字输入框：数值输入，min / max / step | `desktop/number-input.md` |
| UNumberRangeInput | 数字范围输入框：起止数值双输入 | `desktop/number-range-input.md` |
| UPaginator | 分页器：v-model:pageNumber / page-size 服务端分页 | `desktop/paginator.md` |
| UPalette | 调色板：颜色选择面板 | `desktop/palette.md` |
| UPasswordInput | 密码输入框：密码输入与可见性切换 | `desktop/password-input.md` |
| UPopConfirm | 气泡确认：点击操作的轻量二次确认气泡 | `desktop/pop-confirm.md` |
| UProgress | 进度条：线性 / 环形进度展示 | `desktop/progress.md` |
| UProgressNodes | 进度节点：步骤式节点进度 | `desktop/progress-nodes.md` |
| URadio | 单选框：单个单选项 | `desktop/radio.md` |
| URadioGroup | 单选框组：单选值绑定 | `desktop/radio-group.md` |
| URichTextEditor | 富文本编辑器：Lexical 封装的富文本编辑 | `desktop/rich-text-editor.md` |
| UScroll | 滚动容器：自绘 6px 细滚动条，scrollTo / update() | `desktop/scroll.md` |
| USegment | 分段控制器：互斥选项切换 | `desktop/segment.md` |
| USelect | 单选选择器：单选下拉框 | `desktop/select.md` |
| USlider | 滑块：拖拽选取数值 | `desktop/slider.md` |
| USteps | 步骤条：流程步骤指示 | `desktop/steps.md` |
| USwitch | 开关：布尔开关切换 | `desktop/switch.md` |
| UTable | 表格：columns + data 数据表格，多选 / 树形 / 合并 / 表尾合计 / 虚拟滚动 | `desktop/table.md` |
| UTableEditor | 表格编辑器：可编辑表格 | `desktop/table-editor.md` |
| UTabs 系列 | 标签页：UTabs / UTabsHorizontal / UTabsVertical 页签切换 | `desktop/tabs.md` |
| UTag | 标签：状态与分类标记 | `desktop/tag.md` |
| UText | 文本：省略 / 复制等文本排版 | `desktop/text.md` |
| UTextarea | 文本域：多行文本输入 | `desktop/textarea.md` |
| UTheme | 主题编辑器：运行时可视化调整主题 token | `desktop/theme.md` |
| UTip | 文字提示：悬浮提示气泡 | `desktop/tip.md` |
| UTree | 树形控件：层级节点展开勾选 | `desktop/tree.md` |
| UTreeSelect | 树选择器：树形下拉选择 | `desktop/tree-select.md` |
| UWatermark | 水印：页面 / 容器水印 | `desktop/watermark.md` |

### compositions 组合式函数（@veltra/compositions）

| 模块 | 用途 | 文档路径 |
| --- | --- | --- |
| useComponentProps | 插槽公共属性注入：向插槽内容批量下发属性 | `compositions/use-component-props.md` |
| useConfig | 全局配置：size / form.labelWidth 等全局默认值读写 | `compositions/use-config.md` |
| useDnD | 拖拽排序：列表拖拽换位组合式函数 | `compositions/use-dnd.md` |
| useDrag | 元素拖拽：单元素自由拖拽 | `compositions/use-drag.md` |
| useFallbackProps / useFormFallbackProps | 属性多级回退：props 未传时按链取默认 | `compositions/use-fallback-props.md` |
| useModel | 双向绑定：自定义组件的 modelValue 封装 | `compositions/use-model.md` |
| usePop | 浮层定位：弹层锚点定位与翻转 | `compositions/use-pop.md` |
| useReactiveSize | 元素响应式宽高：按容器尺寸切档 | `compositions/use-reactive-size.md` |
| useResizeObserver / useObserverCallback | 尺寸观察：ResizeObserver 封装回调 | `compositions/use-resize-observer.md` |
| useTransition | 过渡动效：命令式触发进出场过渡 | `compositions/use-transition.md` |
| useUserAction / useFocus | 用户交互：用户操作意图判定（本篇含 useFocus 说明） | `compositions/use-user-action.md` |
| useVirtualizer | 虚拟滚动：大数据量列表虚拟化 | `compositions/use-virtualizer.md` |

### directives 指令（@veltra/directives）

| 模块 | 用途 | 文档路径 |
| --- | --- | --- |
| vClickOutside | 点击元素外部时触发回调 | `directives/v-click-outside.md` |
| vFocus | 挂载时自动聚焦 | `directives/v-focus.md` |
| vRipple | 点击波纹动效 | `directives/v-ripple.md` |

### utils 工具函数（@veltra/utils）

| 模块 | 用途 | 文档路径 |
| --- | --- | --- |
| class-name | DOM 类名与 BEM 工具 | `utils/class-name.md` |
| style | 内联样式与层叠工具 | `utils/style.md` |
| scroll | 滚动位置与滚动行为工具 | `utils/scroll.md` |
| vnode | VNode 判断与提取工具 | `utils/vnode.md` |
| animation | 动画与帧工具 | `utils/animation.md` |
| reactive | 响应式与上下文辅助 | `utils/reactive.md` |
| text-nav | 文本高亮、溢出导航与通用类型工具 | `utils/text-nav.md` |

### ai AI 对话（@veltra/ai）

| 模块 | 用途 | 文档路径 |
| --- | --- | --- |
| UAiChat | 对话组件：流式消息列表、工具调用卡片、模型选择、附件 | `ai/ai-chat.md` |
| useChat | 无头对话状态机与三种传输层（OpenAI SSE / 自定义 / 服务端会话） | `ai/use-chat.md` |
| UAiOrb | 活体球：对话运行状态的动效指示球 | `ai/ai-orb.md` |

### sheet 电子表格 UI（@veltra/sheet）

| 模块 | 用途 | 文档路径 |
| --- | --- | --- |
| USheet | 电子表格组件：工具栏 / 公式栏 / 网格 / sheet 标签，填报只读与动态样式 | `sheet/sheet.md` |
| SheetTool / SheetContext | 工具栏扩展：registerTool / unregisterTool 自定义工具与操作门面 | `sheet/sheet-tools.md` |

### sheet-core 表格模型（@veltra/sheet-core）

| 模块 | 用途 | 文档路径 |
| --- | --- | --- |
| model | 底层数据模型：Workbook / Sheet 与单元格存储操作 | `sheet-core/model.md` |
| commands | 命令系统：操作派发与 Undo / Redo 历史撤销重做 | `sheet-core/commands.md` |
| formula | 公式引擎：解析求值与函数扩展 | `sheet-core/formula.md` |
| io | 文件导入导出：XLSX / CSV | `sheet-core/io.md` |
| SheetGrid | 渲染网格：VTable 适配层 | `sheet-core/sheet-grid.md` |

### styles 样式与主题（@veltra/styles）

| 模块 | 用途 | 文档路径 |
| --- | --- | --- |
| loadTheme | 运行时主题：9 个预设、派生、深浅色热替换与 nav 外观 | `styles/theme.md` |
| --u-* tokens | 设计令牌 CSS 变量参考 | `styles/tokens.md` |
| SCSS | pkg:@veltra/styles 的 vars / functions / mixins 与 NodePackageImporter 的解析基准目录规则 | `guide/scss.md` |
| animations | 动画与过渡 CSS 类参考 | `styles/animations.md` |

### recipes 场景方案

| 模块 | 用途 | 文档路径 |
| --- | --- | --- |
| 主题定制 | 预设切换、深浅色、品牌色、侧栏外观与 SCSS token 端到端 | `recipes/theme.md` |
| 表单 | UForm + field 绑定 + 校验 + 联动 + showModified + reset 端到端 | `recipes/form.md` |
| 列表页与详情页 | 布局 + 表格分页 + 确认框 + 抽屉详情端到端 | `recipes/pages.md` |
| 电子表格接入 | USheet 基础接入 + 填报只读 + 自定义工具端到端 | `recipes/sheet.md` |
| AI 对话集成 | 服务端代理 + UAiChat + 无头 useChat 端到端 | `recipes/ai.md` |

### troubleshooting 排障

| 模块 | 用途 | 文档路径 |
| --- | --- | --- |
| 常见报错 | 运行时与构建期高频报错的原文与修复代码：主题未初始化、`Can't find stylesheet to import`、`react/jsx-dev-runtime`、显式 import 导致的裸样式、`UTag is not defined`、UForm 的 field 与 v-model 冲突、VeltraUIResolver 未生效等 | `troubleshooting/common-errors.md` |
