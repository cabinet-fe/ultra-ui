# @veltra/desktop

## 1.6.4

### Patch Changes

- a249243: - `@veltra/sheet-core`：解耦 `SheetGrid` 等渲染层符号至独立子路径 `@veltra/sheet-core/grid`，避免主入口把 `@visactor/vtable` 类型图拉入无头 TS 程序；优化 xlsx 导入性能，只遍历有效 cells Map，并对超大空白格式格设置紧邻带限制，避免极端表格卡死。
  - `@veltra/sheet`：适配 `@veltra/sheet-core/grid` 导出与 xlsx 导入选项。
  - `@veltra/desktop`：file-viewer 动态导入适配 `@veltra/sheet-core/grid`。

## 1.6.3

### Patch Changes

- dec95c9: 优化 `UCollapseItem`：`#header` 插槽仅自定义标题文本区域，右侧展开图标始终保留并受活动状态控制旋转。

## 1.6.2

### Patch Changes

- 2de2112: - 修复 UPalette 对非 `#RRGGBB` 颜色（xlsx 8 位 ARGB、`rgb()` 等）解析错误导致圆形指示器不显示绑定颜色的问题；sheet-core 导入时将 8 位 ARGB 归一为 `#RRGGBB`
  - UNumberInput：步进值为 1 时不再播放数字滚动动画
  - 修复报表数据预览使用未提交的旧 SQL 导致取数为空的问题（预览前自动落草稿）

## 1.6.1

### Patch Changes

- c6d181d: 修复表格列宽分配结果污染用户列配置，导致列森林重建后列宽被永久锁定、容器变窄时出现横向滚动条的问题。

## 1.6.0

### Minor Changes

- 14cdce4: UCollapseItem 新增 `destroyOnCollapse` 属性，折叠后卸载内容 DOM；UButton 优化 text/plain 样式涟漪与边框。
- b1d6b24: UAiChat 工具渲染新增 `renderTo: 'panel'`：工具的 `render` 组件可展示在对话区右侧的侧边面板中（新调用自动打开聚焦，工具卡片仅留「查看面板」入口可切回历史调用），适合后台页面、表单、图表、列表等大交互区工具；`ChatTool.panelWidth` 可指定该工具面板的默认宽度（缺省 420px）。面板与会话区布局基于 `ULayout` 分列，宽度支持拖拽调节。

  `ULayout` 新增 `colMinSizes` 属性（按列约束 resizable 拖拽的最小宽度）与 `resize-start` / `resize-end` 事件；程序化变更 `cols` 时拖拽手柄位置同步更新。

## 1.5.0

### Minor Changes

- 9aa6c0c: 右键菜单增强 + 行列头菜单：

  - `@veltra/desktop` `ContextmenuItem` 新增 `divider` / `render` / `keepOpen`；导出
    `ContextmenuRootDIKey` 供内嵌组件主动关闭菜单
  - `@veltra/sheet` 行号/列头右键独立菜单（插入上下/左右 + 删除 + 冻结/取消冻结）；
    body 插入行/列改为菜单内嵌 `UNumberInput`（默认 N = 选区覆盖行/列数），不再弹独立面板
  - 修复 `deleteRows` / `deleteCols` undo 不还原删除区间内单元格数据的问题
    （`prepareDeletedCellPatches` + undo 在反向结构之后恢复）

- 4368035: 新增 `@veltra/sheet-core` 包，file-viewer Excel 预览迁移：

  - **@veltra/sheet-core（新包）**：框架无关表格核心——`core/`（数据模型 / 命令 / 公式 / IO）+
    `grid/`（VTable 适配层 SheetGrid / ImageLayer）自 `@veltra/sheet` 迁入；SheetGrid 新增
    `readonly` 模式（不挂编辑器、禁编辑回写 / 填充柄 / undo 快捷键 / 行列 resize / 图片拖动删除，
    保留选择 / 滚动 / 右键回调），供只读预览场景使用
  - **@veltra/sheet**：core/grid 迁至 sheet-core，`src/index.ts` 从其 re-export 白名单，
    公开 API 不变；peer 新增 `@veltra/sheet-core`，`@visactor/vtable(-editors)` 不再直接依赖
  - **@veltra/desktop**：file-viewer 的 Excel/CSV 预览从 `@cat-kit/excel` + 裸 `ListTable`
    迁移到 `@veltra/sheet-core`（readonly SheetGrid）——样式 / 合并单元格 / 行高 / 冻结 /
    公式计算保真；peer 移除 `@cat-kit/excel`、新增 `@veltra/sheet-core`，dependencies
    移除 `@visactor/vtable`；`sheetMaxRows` 不再硬裁模型（超限时提示条文案改为如实说明）

### Patch Changes

- 34dca61: xlsx 导入性能与交互反馈优化：

  - **解析提速**（`core/io/import.ts`）：hucre 稠密行数组空槽快速跳过 + 表格尺寸按实际使用范围收敛。实测 196 sheet / 75 万格预算套表：解析 110s → 3.5s；含「全选设边框」残留（整表 13327 行 × 16384 列空白格式格）的 sheet 不再把渲染尺寸撑到 Excel 极限，切换 30s → 0.3s
  - **解析移入 Web Worker**（`vue/popups/import.worker.ts`）：选文件后主线程空闲（loading 动画正常转、页面可交互），解析完成才弹确认框；worker 不可用（构造失败/加载失败）自动降级主线程解析
  - **交互反馈**：解析期经 provide/inject 状态在 grid 容器挂 desktop `v-loading`；replaceWorkbook 前「正在导入…」常驻提示（try/catch/finally 兜底，失败明确报错）；等首帧渲染完成再报「导入完成」（导入后立即点单元格/滚动不再撞上 vrender 渲染任务，实测 3~5s → 16ms）
  - **desktop message-confirm**：根元素补基础 `transition`——Vue transition-group 检测不到根过渡时 after-leave 同步触发，弹窗关闭动画被 onClosed 同步重活阻塞（点击后卡 1.6s 才关）

## 1.4.0

### Patch Changes

- 394ea96: UCollapse 视觉改为边框卡片风格（对齐 AI tool-call），默认展开图标改为 ArrowDown 并旋转 180°；移除 collapse 专用 mix/theme token。`UCollapseItem` 支持独立 `v-model`；`UAiChat` tool-call 卡片直接复用独立 `UCollapseItem`，去掉重复的卡片壳与 chevron 样式。
- Updated dependencies [394ea96]
  - @veltra/styles@1.4.0
  - @veltra/directives@1.4.0
  - @veltra/utils@1.4.0
  - @veltra/compositions@1.4.0
  - @veltra/icons@1.4.0

## 1.3.10

### Patch Changes

- ffb6756: 修复 AutoComplete 下拉选项在暗色主题下高亮/选中态对比度严重不足（文字不可读）的问题，交互态颜色改用随主题适配的 `--u-nav-hover-*` / `--u-nav-active-*` 变量；同时修复手动关闭面板后再次输入时下拉面板不重新展开的问题。
- Updated dependencies [6308e5b]
  - @veltra/styles@1.3.10
  - @veltra/directives@1.3.10
  - @veltra/utils@1.3.10
  - @veltra/compositions@1.3.10
  - @veltra/icons@1.3.10

## 1.3.9

### Patch Changes

- Updated dependencies [b7fe083]
  - @veltra/compositions@1.3.9
  - @veltra/styles@1.3.9
  - @veltra/directives@1.3.9
  - @veltra/utils@1.3.9
  - @veltra/icons@1.3.9

## 1.3.8

### Patch Changes

- a80a9b3: `USelect` / `UTreeSelect` 移除 `text` prop 与 `v-model:text`。展示文案仅由选项/`data` 推导，并通过单向 `@update:text` 通知父级同步冗余字段。

  迁移：`v-model:text="form.text"` → `@update:text="form.text = $event"`。

  - @veltra/utils@1.3.8
  - @veltra/styles@1.3.8
  - @veltra/compositions@1.3.8
  - @veltra/directives@1.3.8
  - @veltra/icons@1.3.8

## 1.3.7

### Patch Changes

- Updated dependencies [afd1656]
  - @veltra/styles@1.3.7
  - @veltra/directives@1.3.7
  - @veltra/utils@1.3.7
  - @veltra/compositions@1.3.7
  - @veltra/icons@1.3.7

## 1.3.6

### Patch Changes

- dc550a4: 统一选择器交互：Select、MultiSelect、TreeSelect、MultiTreeSelect 的查询过滤与输入创建从下拉面板迁移到触发输入框

  - Select/TreeSelect：`filterable` 时触发输入框可直接输入过滤，`creatable` 时回车创建；面板展开时已选标签降级为占位提示，点击输入区域不再收起面板；选中后立即恢复显示选中值，不再等待面板关闭动画；非查询态下触发输入框保持只读防误输入
  - MultiSelect/MultiTreeSelect：`filterable` 时触发器内嵌输入框，支持输入过滤、回车创建（MultiSelect），勾选后保持输入焦点
  - 修复创建选项临时项在精确匹配后残留的问题；已创建选项并入过滤数据源参与匹配，多次创建不再互相覆盖
  - @veltra/utils@1.3.6
  - @veltra/styles@1.3.6
  - @veltra/compositions@1.3.6
  - @veltra/directives@1.3.6
  - @veltra/icons@1.3.6

## 1.3.5

### Patch Changes

- e9b830d: 修复 Tree `disabledNode` 在节点 `children` 未挂载时调用的问题，改为整棵树构建完成后再判定 disabled
  - @veltra/utils@1.3.5
  - @veltra/styles@1.3.5
  - @veltra/compositions@1.3.5
  - @veltra/directives@1.3.5
  - @veltra/icons@1.3.5

## 1.3.4

### Patch Changes

- Updated dependencies [b9e0bd1]
  - @veltra/compositions@1.3.4
  - @veltra/styles@1.3.4
  - @veltra/directives@1.3.4
  - @veltra/utils@1.3.4
  - @veltra/icons@1.3.4

## 1.3.3

### Patch Changes

- 4d301d3: 重构 messageConfirm / notification 命令式 API：统一容器渲染与实例生命周期，导出由 MessageConfirm / Notification 调整为 camelCase
  - @veltra/utils@1.3.3
  - @veltra/styles@1.3.3
  - @veltra/compositions@1.3.3
  - @veltra/directives@1.3.3
  - @veltra/icons@1.3.3

## 1.3.2

### Patch Changes

- 8c8c459: UTip 新增 showDelay 弹出延时配置；UFormItem tips 默认延迟 500ms 弹出
  - @veltra/utils@1.3.2
  - @veltra/styles@1.3.2
  - @veltra/compositions@1.3.2
  - @veltra/directives@1.3.2
  - @veltra/icons@1.3.2

## 1.3.1

### Patch Changes

- 65440e7: UCodeEditor 新增 `markdown` 语言高亮支持（按需加载 `@codemirror/lang-markdown`）。
- f6c2fc6: 优化默认主题视觉细节：圆角阶梯从 4/6/8 调整为 6/8/12（对齐 Tailwind rounded-md/lg/xl）；卡片内边距收紧为 8/12/16 并使用 12px 圆角（新增 `--u-card-radius` token）；区分结构边框与控件描边（light 控件描边加深为 `#d4d4d8`，dark 整体提亮），修复 hero 主题 muted 边框透明、glass 主题亮色边框不可见的问题；焦点环统一使用 `--u-focus-ring` token（breadcrumb、condition-editor、rich-text-editor），并修复 button plain/text 变体覆盖焦点环的层叠问题。
- Updated dependencies [f6c2fc6]
  - @veltra/styles@1.3.1
  - @veltra/directives@1.3.1
  - @veltra/utils@1.3.1
  - @veltra/compositions@1.3.1
  - @veltra/icons@1.3.1

## 1.3.0

### Minor Changes

- db6c574: 设计系统默认视觉焕新与暗色修复

  - 默认 light/dark 主题重新调色：中性冷灰阶 + 精制语义色；暗色阴影由白色系改为黑色系
  - 新增阴影分级 token（`--u-shadow-sm` / `--u-shadow-lg`）、动效 token（`--u-transition-fast/normal/slow`、`--u-transition-ease(-out)`）、统一焦点环 `--u-focus-ring` 与卡片内边距 `--u-card-padding-*`
  - 按钮默认圆角由胶囊（9999px）改为 radius token；卡片默认 16px 内边距 + 细边框 + 柔和阴影；输入框水平内边距加大并补焦点环
  - checkbox/radio/switch 原生输入改为视觉隐藏但可聚焦，核心控件统一补齐键盘 `:focus-visible` 指示；slider thumb 可聚焦并补 hover
  - 浮层（dialog/drawer/dropdown/notification/tip/message 等）阴影统一迁移到 `--u-shadow-lg`
  - 修复暗色破版点：text/tabs/nav/group-nav/contextmenu/scroll/code-editor 等硬编码颜色改为 token 派生；组件级 token（nav、table）去硬编码以跟随自定义主题
  - 修复 rich-text-editor 无效的 `rgba(var)` focus ring 声明；修复非 hex 主题值（rgba）生成 `NaN` CSS 变量声明的问题

### Patch Changes

- Updated dependencies [db6c574]
  - @veltra/styles@1.3.0
  - @veltra/directives@1.3.0
  - @veltra/utils@1.3.0
  - @veltra/compositions@1.3.0
  - @veltra/icons@1.3.0

## 1.2.34

### Patch Changes

- Updated dependencies [24c7801]
  - @veltra/icons@1.2.34
  - @veltra/utils@1.2.34
  - @veltra/styles@1.2.34
  - @veltra/compositions@1.2.34
  - @veltra/directives@1.2.34

## 1.2.33

### Patch Changes

- edc77de: 新增 UGroupNav 分组导航组件；UDualNav 支持 labeled 左轨变体
  - @veltra/utils@1.2.33
  - @veltra/styles@1.2.33
  - @veltra/compositions@1.2.33
  - @veltra/directives@1.2.33
  - @veltra/icons@1.2.33

## 1.2.32

### Patch Changes

- 1f2fed5: UCodeEditor 新增 bash / powershell 语言支持
  - @veltra/utils@1.2.32
  - @veltra/styles@1.2.32
  - @veltra/compositions@1.2.32
  - @veltra/directives@1.2.32
  - @veltra/icons@1.2.32

## 1.2.31

### Patch Changes

- cb56cd2: BatchEdit 新增 create / create-prev / create-next / create-child 事件，表单插槽暴露 parentRow 与 formActionType；修复 createChild 动态权限判断应基于父级行
  - @veltra/utils@1.2.31
  - @veltra/styles@1.2.31
  - @veltra/compositions@1.2.31
  - @veltra/directives@1.2.31
  - @veltra/icons@1.2.31

## 1.2.30

### Patch Changes

- 1b6fe3d: 修复 GridInput 设置分隔符后 modelValue 回显不显示的问题
  - @veltra/utils@1.2.30
  - @veltra/styles@1.2.30
  - @veltra/compositions@1.2.30
  - @veltra/directives@1.2.30
  - @veltra/icons@1.2.30

## 1.2.29

### Patch Changes

- d78f26d: UCodeEditor 新增 SpEL 语言支持（语法高亮与基础补全），单语言时右上角展示语言名称标签
  - @veltra/utils@1.2.29
  - @veltra/styles@1.2.29
  - @veltra/compositions@1.2.29
  - @veltra/directives@1.2.29
  - @veltra/icons@1.2.29

## 1.2.28

### Patch Changes

- 8382acd: 修复 GridInput 无法输入 0 的问题，并正确实现 zero 开关（验证码可开、组织编码结构可关）
  - @veltra/utils@1.2.28
  - @veltra/styles@1.2.28
  - @veltra/compositions@1.2.28
  - @veltra/directives@1.2.28
  - @veltra/icons@1.2.28

## 1.2.27

### Patch Changes

- 42d2014: 修复 NumberRangeInput 输入过程中交叉约束过早改写另一侧；优化 BatchEdit 保存按钮、新增后表单重置与 Escape 关闭行为
  - @veltra/utils@1.2.27
  - @veltra/styles@1.2.27
  - @veltra/compositions@1.2.27
  - @veltra/directives@1.2.27
  - @veltra/icons@1.2.27

## 1.2.26

### Patch Changes

- b8b9816: fix(table): fixed 列未设 width 时不再参与剩余宽度均分
  - @veltra/utils@1.2.26
  - @veltra/styles@1.2.26
  - @veltra/compositions@1.2.26
  - @veltra/directives@1.2.26
  - @veltra/icons@1.2.26

## 1.2.25

### Patch Changes

- e6a0721: UCodeEditor：`language` 改为 `langs` + `v-model:lang`，新增 prefix/suffix 外壳；表单组件统一用 `fieldKey` 处理 label/value 字段名
- Updated dependencies [e6a0721]
  - @veltra/utils@1.2.25
  - @veltra/compositions@1.2.25
  - @veltra/directives@1.2.25
  - @veltra/styles@1.2.25
  - @veltra/icons@1.2.25

## 1.2.24

### Patch Changes

- 08ea34b: 修复 Select 清空时未重置选中索引和显示标签的问题
  - @veltra/utils@1.2.24
  - @veltra/styles@1.2.24
  - @veltra/compositions@1.2.24
  - @veltra/directives@1.2.24
  - @veltra/icons@1.2.24

## 1.2.23

### Patch Changes

- 56355a2: 主题系统新增 color-a alpha token 与组件混合色 token，统一替换组件内 color-mix；导航子菜单改用 has-active 类替代 :has 选择器
  - @veltra/utils@1.2.23
  - @veltra/styles@1.2.23
  - @veltra/compositions@1.2.23
  - @veltra/directives@1.2.23
  - @veltra/icons@1.2.23

## 1.2.22

### Patch Changes

- b9ee60a: 表单控件正确透传 attrs（inheritAttrs: false + v-bind="$attrs"），并移除 UFormItem viewer 冗余样式
  - @veltra/utils@1.2.22
  - @veltra/styles@1.2.22
  - @veltra/compositions@1.2.22
  - @veltra/directives@1.2.22
  - @veltra/icons@1.2.22

## 1.2.21

### Patch Changes

- 0761b2c: UForm 默认栅格间距设为 0 12px；UFormItem 必填星号增加右侧间距
  - @veltra/utils@1.2.21
  - @veltra/styles@1.2.21
  - @veltra/compositions@1.2.21
  - @veltra/directives@1.2.21
  - @veltra/icons@1.2.21

## 1.2.20

### Patch Changes

- f028c42: UForm / UFormItem 支持 labelPosition 属性，可设置标签在顶部或左侧显示
  - @veltra/utils@1.2.20
  - @veltra/styles@1.2.20
  - @veltra/compositions@1.2.20
  - @veltra/directives@1.2.20
  - @veltra/icons@1.2.20

## 1.2.19

### Patch Changes

- 12b276a: UCodeEditor 语言包改为按需加载
  - @veltra/utils@1.2.19
  - @veltra/styles@1.2.19
  - @veltra/compositions@1.2.19
  - @veltra/directives@1.2.19
  - @veltra/icons@1.2.19

## 1.2.18

### Patch Changes

- b721a2a: 修复 UCodeEditor 切换语言后无语法高亮与补全
  - @veltra/utils@1.2.18
  - @veltra/styles@1.2.18
  - @veltra/compositions@1.2.18
  - @veltra/directives@1.2.18
  - @veltra/icons@1.2.18

## 1.2.17

### Patch Changes

- ebfeb42: 将 @codemirror/\* 打包进 @veltra/desktop 产物，下游无需安装 codemirror，避免多实例版本冲突
  - @veltra/utils@1.2.17
  - @veltra/styles@1.2.17
  - @veltra/compositions@1.2.17
  - @veltra/directives@1.2.17
  - @veltra/icons@1.2.17

## 1.2.16

### Patch Changes

- 77e1e10: 隐藏 layout 组件分割条的背景色
  - @veltra/utils@1.2.16
  - @veltra/styles@1.2.16
  - @veltra/compositions@1.2.16
  - @veltra/directives@1.2.16
  - @veltra/icons@1.2.16

## 1.2.15

### Patch Changes

- b8b8b22: 将 @codemirror/\* 依赖锁定为精确版本，避免下游项目版本漂移导致运行时错误。
  - @veltra/utils@1.2.15
  - @veltra/styles@1.2.15
  - @veltra/compositions@1.2.15
  - @veltra/directives@1.2.15
  - @veltra/icons@1.2.15

## 1.2.14

### Patch Changes

- Updated dependencies [457b117]
  - @veltra/styles@1.2.14
  - @veltra/directives@1.2.14
  - @veltra/utils@1.2.14
  - @veltra/compositions@1.2.14
  - @veltra/icons@1.2.14

## 1.2.13

### Patch Changes

- 1994c46: 修正 Action、FormItem 组件名称引用，将 build 脚本从 package.json 迁移至 vite.config.ts
  - @veltra/utils@1.2.13
  - @veltra/styles@1.2.13
  - @veltra/compositions@1.2.13
  - @veltra/directives@1.2.13
  - @veltra/icons@1.2.13

## 1.2.12

### Patch Changes

- aaf1ee4: - 表单相关图标重命名为 `form-*` 前缀，避免与通用图标命名冲突
  - 同步更新 desktop 组件与 playground 图标引用
  - @veltra/utils@1.2.12
  - @veltra/styles@1.2.12
  - @veltra/compositions@1.2.12
  - @veltra/directives@1.2.12
  - @veltra/icons@1.2.12

## 1.2.11

### Patch Changes

- 629843e: - Cascade 新增 `showFullPath` 属性，支持仅展示/提交叶子节点
  - 修正 UForm 组件注册名称
  - 升级 @cat-kit peer 依赖至 1.1.8
  - @veltra/utils@1.2.11
  - @veltra/styles@1.2.11
  - @veltra/compositions@1.2.11
  - @veltra/directives@1.2.11
  - @veltra/icons@1.2.11

## 1.2.10

### Patch Changes

- 82c85d7: 修复 batch-edit 切换编辑行时表单未正确重置、model 同步时机过早导致初始状态丢失的问题。
  - @veltra/utils@1.2.10
  - @veltra/styles@1.2.10
  - @veltra/compositions@1.2.10
  - @veltra/directives@1.2.10
  - @veltra/icons@1.2.10

## 1.2.9

### Patch Changes

- 50be447: 修复 batch-edit 切换编辑行时表单状态被提前重置的问题；form 插槽改为标准 slot 透传。
  - @veltra/utils@1.2.9
  - @veltra/styles@1.2.9
  - @veltra/compositions@1.2.9
  - @veltra/directives@1.2.9
  - @veltra/icons@1.2.9

## 1.2.8

### Patch Changes

- 92edbbe: 修复 batch-edit quick 模式下表单条件字段无法响应当前编辑行的问题：表单改由 `model` 中转实时写回 `row.data`，所有模式均回填 model。
  - @veltra/utils@1.2.8
  - @veltra/styles@1.2.8
  - @veltra/compositions@1.2.8
  - @veltra/directives@1.2.8
  - @veltra/icons@1.2.8

## 1.2.7

### Patch Changes

- 2829efc: - UDualNav: 点击左轨应用时默认跳转该应用下首个叶子节点路径
  - UDualNav: 移除导航默认外边框线条与右栏 header 下方分隔线
  - @veltra/utils@1.2.7
  - @veltra/styles@1.2.7
  - @veltra/compositions@1.2.7
  - @veltra/directives@1.2.7
  - @veltra/icons@1.2.7

## 1.2.6

### Patch Changes

- c41e665: - ULoading: 重构加载类型枚举为 `dual-ring` / `dot` / `ring` / `bars`，默认值改为 `dual-ring`（breaking：移除 `classic` / `line` / `spinner` / `morph`）
  - UDualNav: 左轨应用项增加 tooltip 展示描述、`selected` 选中态样式，并接入 ripple 指令
  - @veltra/utils@1.2.6
  - @veltra/styles@1.2.6
  - @veltra/compositions@1.2.6
  - @veltra/directives@1.2.6
  - @veltra/icons@1.2.6

## 1.2.5

### Patch Changes

- 53d024d: - 将 UMenu 重命名为 UNav，新增 UDualNav 双栏导航组件
  - 优化 UBatchEdit 功能特性与交互
  - 更新 VeltraDesktopUIResolver 以支持导航组件重命名
  - 合并 playground 为统一预览应用
  - @veltra/utils@1.2.5
  - @veltra/styles@1.2.5
  - @veltra/compositions@1.2.5
  - @veltra/directives@1.2.5
  - @veltra/icons@1.2.5

## 1.2.4

### Patch Changes

- 1f8785d: 修复表格 `columns` 为空时注入占位列导致 cell key 为 NaN 的 Vue 警告。
  - @veltra/utils@1.2.4
  - @veltra/styles@1.2.4
  - @veltra/compositions@1.2.4
  - @veltra/directives@1.2.4
  - @veltra/icons@1.2.4

## 1.2.3

### Patch Changes

- Updated dependencies [141a90b]
  - @veltra/icons@1.2.3
  - @veltra/utils@1.2.3
  - @veltra/styles@1.2.3
  - @veltra/compositions@1.2.3
  - @veltra/directives@1.2.3

## 1.2.2

### Patch Changes

- 1f8fbd7: `UForm.validate` 校验失败后自动滚动到首个错误项的 `error-text` 元素。
  - @veltra/utils@1.2.2
  - @veltra/styles@1.2.2
  - @veltra/compositions@1.2.2
  - @veltra/directives@1.2.2
  - @veltra/icons@1.2.2

## 1.2.1

### Patch Changes

- acadad3: 将表单字段校验规则与通用属性类型上移至 `@veltra/utils.FormComponentProps`，删除 `@veltra/desktop` 中的 `form-field` 类型。
- Updated dependencies [acadad3]
  - @veltra/utils@1.2.1
  - @veltra/compositions@1.2.1
  - @veltra/directives@1.2.1
  - @veltra/styles@1.2.1
  - @veltra/icons@1.2.1

## 1.2.0

### Minor Changes

- a9b9eff: 重构表单体系：移除 `IFormModel` / `dynamic-form-model`，`UForm` 改为使用 `Record` 数据模型；校验逻辑下沉至 `form-item` 与各表单控件 `rules` 属性；从 `@veltra/utils` 移除 `validate` 导出及相关类型。

### Patch Changes

- Updated dependencies [a9b9eff]
  - @veltra/utils@1.2.0
  - @veltra/compositions@1.2.0
  - @veltra/directives@1.2.0
  - @veltra/styles@1.2.0
  - @veltra/icons@1.2.0

## 1.1.36

### Patch Changes

- 25259dd: 修复 Dialog 最大化过渡时的临时高度清除逻辑，并在 Loading 组件中新增 morph 动画类型并重构部分动画效果。
  - @veltra/utils@1.1.36
  - @veltra/styles@1.1.36
  - @veltra/compositions@1.1.36
  - @veltra/directives@1.1.36
  - @veltra/icons@1.1.36

## 1.1.35

### Patch Changes

- 08fc992: Dialog: 新增 `transition` 属性支持自定义过渡动画，默认使用 `fade-scale`（macOS 风格平滑缩放），清理未使用的模板引用；新增 `fade-scale` 过渡样式。
- Updated dependencies [08fc992]
  - @veltra/styles@1.1.35
  - @veltra/directives@1.1.35
  - @veltra/utils@1.1.35
  - @veltra/compositions@1.1.35
  - @veltra/icons@1.1.35

## 1.1.34

### Patch Changes

- ec5375a: fix(table): 修复 tree 模式下行缩进计算错误
  - @veltra/utils@1.1.34
  - @veltra/styles@1.1.34
  - @veltra/compositions@1.1.34
  - @veltra/directives@1.1.34
  - @veltra/icons@1.1.34

## 1.1.33

### Patch Changes

- b029d8b: fix(desktop): 表格列宽分配逻辑，显式指定 width 的列不参与剩余宽度均分
  - @veltra/utils@1.1.33
  - @veltra/styles@1.1.33
  - @veltra/compositions@1.1.33
  - @veltra/directives@1.1.33
  - @veltra/icons@1.1.33

## 1.1.32

### Patch Changes

- 003cc7b: contextmenu 支持子菜单嵌套与图标列对齐
  - @veltra/utils@1.1.32
  - @veltra/styles@1.1.32
  - @veltra/compositions@1.1.32
  - @veltra/directives@1.1.32
  - @veltra/icons@1.1.32

## 1.1.31

### Patch Changes

- c6da8e9: context-menu 组件外层包裹 Teleport to body，确保菜单不受父容器 overflow/z-index 影响
  - @veltra/utils@1.1.31
  - @veltra/styles@1.1.31
  - @veltra/compositions@1.1.31
  - @veltra/directives@1.1.31
  - @veltra/icons@1.1.31

## 1.1.30

### Patch Changes

- 8f2a4fc: 补全 tabs 默认插槽 defineSlots 类型声明及 slot props index 属性
  - @veltra/utils@1.1.30
  - @veltra/styles@1.1.30
  - @veltra/compositions@1.1.30
  - @veltra/directives@1.1.30
  - @veltra/icons@1.1.30

## 1.1.29

### Patch Changes

- 79170a5: tabs 组件 item 插槽从动态具名插槽改为默认插槽，slot props 为 { item, index }
  - @veltra/utils@1.1.29
  - @veltra/styles@1.1.29
  - @veltra/compositions@1.1.29
  - @veltra/directives@1.1.29
  - @veltra/icons@1.1.29

## 1.1.28

### Patch Changes

- 9fd24ea: 放宽 IFormModel 对外方法类型，UBatchEdit 泛型对齐 IFormModel，修复具体 FormModel 实例无法传给 batch-edit 的类型错误
  - @veltra/utils@1.1.28
  - @veltra/styles@1.1.28
  - @veltra/compositions@1.1.28
  - @veltra/directives@1.1.28
  - @veltra/icons@1.1.28

## 1.1.27

### Patch Changes

- eb09b60: 收紧 FormModel 泛型约束为 FormModelField
  - @veltra/utils@1.1.27
  - @veltra/styles@1.1.27
  - @veltra/compositions@1.1.27
  - @veltra/directives@1.1.27
  - @veltra/icons@1.1.27

## 1.1.26

### Patch Changes

- Updated dependencies [7ef551a]
  - @veltra/styles@1.1.26
  - @veltra/directives@1.1.26
  - @veltra/utils@1.1.26
  - @veltra/compositions@1.1.26
  - @veltra/icons@1.1.26

## 1.1.25

### Patch Changes

- 9231b2c: 优化 FormModel 泛型定义，支持嵌套属性类型推导，并更新相关 Playground 演示与技能文档。
  - @veltra/utils@1.1.25
  - @veltra/styles@1.1.25
  - @veltra/compositions@1.1.25
  - @veltra/directives@1.1.25
  - @veltra/icons@1.1.25

## 1.1.24

### Patch Changes

- Updated dependencies [767edb6]
  - @veltra/styles@1.1.24
  - @veltra/directives@1.1.24
  - @veltra/utils@1.1.24
  - @veltra/compositions@1.1.24
  - @veltra/icons@1.1.24

## 1.1.23

### Patch Changes

- 7244329: feat(password-input): 悬停显示清除按钮并与明文切换共存
  - @veltra/utils@1.1.23
  - @veltra/styles@1.1.23
  - @veltra/compositions@1.1.23
  - @veltra/directives@1.1.23
  - @veltra/icons@1.1.23

## 1.1.22

### Patch Changes

- cdb5a75: - Collapse：移除 `bordered` 模式，优化默认视觉样式
  - Table：避免对已 reactive 的列配置重复 shallowReactive 包裹
  - 提升 `@cat-kit/core`、`@cat-kit/fe` peer 最低版本至 1.1.5
  - @veltra/utils@1.1.22
  - @veltra/styles@1.1.22
  - @veltra/compositions@1.1.22
  - @veltra/directives@1.1.22
  - @veltra/icons@1.1.22

## 1.1.21

### Patch Changes

- 312a212: fix(desktop): remove redundant u-scroll container in pdf-previewer that breaks page panning and virtual scrolling
  - @veltra/utils@1.1.21
  - @veltra/styles@1.1.21
  - @veltra/compositions@1.1.21
  - @veltra/directives@1.1.21
  - @veltra/icons@1.1.21

## 1.1.20

### Patch Changes

- f5dc83c: fix(desktop): 修复 scroll 组件滚动条无法滚动到底部的 bug，重构并精简了滚动计算逻辑。
  - @veltra/utils@1.1.20
  - @veltra/styles@1.1.20
  - @veltra/compositions@1.1.20
  - @veltra/directives@1.1.20
  - @veltra/icons@1.1.20

## 1.1.19

### Patch Changes

- Updated dependencies [e63faf1]
  - @veltra/styles@1.1.19
  - @veltra/directives@1.1.19
  - @veltra/utils@1.1.19
  - @veltra/compositions@1.1.19
  - @veltra/icons@1.1.19

## 1.1.18

### Patch Changes

- 503ad2b: 重构条件编辑器数据模型与求值机制；@cat-kit/\* 依赖结构调整为 peerDependencies；各类构建配置与类型修复
- Updated dependencies [503ad2b]
  - @veltra/utils@1.1.18
  - @veltra/styles@1.1.18
  - @veltra/compositions@1.1.18
  - @veltra/directives@1.1.18
  - @veltra/icons@1.1.18

## 1.1.17

### Patch Changes

- Updated dependencies [5bd35b3]
  - @veltra/styles@1.1.17
  - @veltra/directives@1.1.17
  - @veltra/utils@1.1.17
  - @veltra/compositions@1.1.17
  - @veltra/icons@1.1.17

## 1.1.16

### Patch Changes

- ab50e27: 移除 `theme` 子路径中不再推荐对外使用的 `component-css-vars` 重导出；修正 `anime` → `transitions` 引用路径
- Updated dependencies [ab50e27]
  - @veltra/styles@1.1.16
  - @veltra/directives@1.1.16
  - @veltra/utils@1.1.16
  - @veltra/compositions@1.1.16
  - @veltra/icons@1.1.16

## 1.1.15

### Patch Changes

- Updated dependencies [696fdb8]
  - @veltra/icons@1.1.15
  - @veltra/utils@1.1.15
  - @veltra/styles@1.1.15
  - @veltra/compositions@1.1.15
  - @veltra/directives@1.1.15

## 1.1.14

### Patch Changes

- 429d393: BatchEdit: 修复 layout rows 属性为 minmax(0, 1fr) 避免内容溢出；修正 CSS 高度与溢出规则
  - @veltra/utils@1.1.14
  - @veltra/styles@1.1.14
  - @veltra/compositions@1.1.14
  - @veltra/directives@1.1.14
  - @veltra/icons@1.1.14

## 1.1.13

### Patch Changes

- 139b672: Scroll: 新增 scrollbar 始终可见选项，优化滚动性能
  FileViewer: 新增 PDF 视口滚动同步与缩放桥接组件，改进图像预览
  - @veltra/utils@1.1.13
  - @veltra/styles@1.1.13
  - @veltra/compositions@1.1.13
  - @veltra/directives@1.1.13
  - @veltra/icons@1.1.13

## 1.1.12

### Patch Changes

- df8bd87: 修复 Collapse 标题颜色引用错误，改用组件级 CSS 变量；修正字号令牌引用
- Updated dependencies [df8bd87]
  - @veltra/styles@1.1.12
  - @veltra/directives@1.1.12
  - @veltra/utils@1.1.12
  - @veltra/compositions@1.1.12
  - @veltra/icons@1.1.12

## 1.1.11

### Patch Changes

- 3da8564: Collapse 新增 `bordered` 边框模式属性；Tabs 移除无内容时冗余渲染判断，简化内容渲染逻辑
  - @veltra/utils@1.1.11
  - @veltra/styles@1.1.11
  - @veltra/compositions@1.1.11
  - @veltra/directives@1.1.11
  - @veltra/icons@1.1.11

## 1.1.10

### Patch Changes

- 106d0d6: 重构 UButton 样式以支持全胶囊圆角与组件级 CSS 变量，重构 UCollapse 为独立胶囊卡片设计并废弃 bordered 属性和 Exposed 实例方法，同时简化 UTabs 动画为 fade 淡入淡出。
  - @veltra/utils@1.1.10
  - @veltra/styles@1.1.10
  - @veltra/compositions@1.1.10
  - @veltra/directives@1.1.10
  - @veltra/icons@1.1.10

## 1.1.9

### Patch Changes

- ca68f74: chore: republish all packages since 1.1.8 was not published
- Updated dependencies [ca68f74]
  - @veltra/utils@1.1.9
  - @veltra/styles@1.1.9
  - @veltra/compositions@1.1.9
  - @veltra/directives@1.1.9
  - @veltra/icons@1.1.9

## 1.1.8

### Patch Changes

- 7cfd23b: 修复文件预览器问题
  - @veltra/utils@1.1.8
  - @veltra/styles@1.1.8
  - @veltra/compositions@1.1.8
  - @veltra/directives@1.1.8
  - @veltra/icons@1.1.8

## 1.1.7

### Patch Changes

- cc1d822: 优化基础主题配置与组件样式细节，增加并优化按钮、树形控件、级联选择器、表达式编辑器芯片、分页器、标签等组件在亮色/暗色及 Shadcn 主题下的样式表现与 CSS 变量定制支持。
- Updated dependencies [cc1d822]
  - @veltra/styles@1.1.7
  - @veltra/directives@1.1.7
  - @veltra/utils@1.1.7
  - @veltra/compositions@1.1.7
  - @veltra/icons@1.1.7

## 1.1.6

### Patch Changes

- 5fa0397: feat(desktop): 新增 kbd 组件，优化 batch-edit 样式与逻辑
  - @veltra/utils@1.1.6
  - @veltra/styles@1.1.6
  - @veltra/compositions@1.1.6
  - @veltra/directives@1.1.6
  - @veltra/icons@1.1.6

## 1.1.5

### Patch Changes

- 14c03c0: fix(desktop): 重构 action、batch-edit 组件逻辑与样式，简化 table 固定列实现，更新 form-item 与 dialog/drawer 样式
- Updated dependencies [14c03c0]
  - @veltra/compositions@1.1.5
  - @veltra/styles@1.1.5
  - @veltra/directives@1.1.5
  - @veltra/utils@1.1.5
  - @veltra/icons@1.1.5

## 1.1.4

### Patch Changes

- 27aa057: fix(desktop): expression-editor and number-range-input width; group-input add button type; multi-select-option ripple refactor

  fix(directives/ripple): use dataset-based reference counting for safe multi-instance collaboration

- Updated dependencies [27aa057]
  - @veltra/directives@1.1.4
  - @veltra/utils@1.1.4
  - @veltra/styles@1.1.4
  - @veltra/compositions@1.1.4
  - @veltra/icons@1.1.4

## 1.1.3

### Patch Changes

- 将表单上下文抽到 `@veltra/utils`，统一 `form` 相关组件的 `provide/inject` 入口。
- Updated dependencies
  - @veltra/utils@1.1.3
  - @veltra/compositions@1.1.3
  - @veltra/directives@1.1.3
  - @veltra/styles@1.1.3
  - @veltra/icons@1.1.3

## 1.1.2

### Patch Changes

- ef0ef2d: Refine shared expand transitions and related component/theme behavior.
- Updated dependencies [ef0ef2d]
  - @veltra/utils@1.1.2
  - @veltra/styles@1.1.2
  - @veltra/compositions@1.1.2
  - @veltra/directives@1.1.2
  - @veltra/icons@1.1.2

## 1.1.1

### Patch Changes

- Updated dependencies [a9e4a86]
  - @veltra/styles@1.1.1
  - @veltra/directives@1.1.1
  - @veltra/utils@1.1.1
  - @veltra/compositions@1.1.1
  - @veltra/icons@1.1.1

## 1.1.0

### Minor Changes

- dad6fef: refactor: replace hardcoded backdrop-filter with bg-filter CSS variable across components; add `is-not` SCSS mixin for cleaner disabled state selectors; improve input clearable/suffix interaction; add number-input clearable support; fix badge type safety; fix palette clear alpha bug; fix select displayed value; fix progress-nodes border color token; adjust hero/shadcn/glass themes

### Patch Changes

- Updated dependencies [dad6fef]
  - @veltra/styles@1.1.0
  - @veltra/directives@1.1.0
  - @veltra/utils@1.1.0
  - @veltra/compositions@1.1.0
  - @veltra/icons@1.1.0

## 1.0.15

### Patch Changes

- d8b4829: fix: expression-editor IME 合成保护 & chip 样式调整 & tip 重定位优化
  - @veltra/utils@1.0.15
  - @veltra/styles@1.0.15
  - @veltra/compositions@1.0.15
  - @veltra/directives@1.0.15
  - @veltra/icons@1.0.15

## 1.0.14

### Patch Changes

- 3da006a: - desktop: 重写 expression-editor，移除 lexical 依赖；batch-edit 合并精简实现
  - desktop: action / cascade / code-editor / dialog / layout / number-input / table / tree 体验与样式细节优化
  - icons: 新增 dot 图标
  - styles: 调整 spring 动效曲线
  - compositions: 精简 use-drag 内部实现
- Updated dependencies [3da006a]
  - @veltra/icons@1.0.14
  - @veltra/styles@1.0.14
  - @veltra/compositions@1.0.14
  - @veltra/directives@1.0.14
  - @veltra/utils@1.0.14

## 1.0.13

### Patch Changes

- de2c2ce: 重构 Collapse 组件 props 类型：`CollapseProps` 改为继承 `ComponentProps` 复用通用 `size`，组件内部不再显式列出各个 prop，直接使用 `defineProps<CollapseProps>()`。
  - @veltra/utils@1.0.13
  - @veltra/styles@1.0.13
  - @veltra/compositions@1.0.13
  - @veltra/directives@1.0.13
  - @veltra/icons@1.0.13

## 1.0.12

### Patch Changes

- b072b20: Collapse 组件全面增强：新增 `size` / `bordered`(ghost) / `iconPosition` / `expandIcon` / `hideIcon`，以 `height` 数值过渡替代 `grid-template-rows` 提升嵌套场景流畅度，暴露 `toggle` / `expand` / `collapse` / `expandAll` / `collapseAll` 实例方法，`#icon` 插槽提供 `isActive` 状态；`@veltra/vite` resolver 注册 `UCollapse` / `UCollapseItem` 自动按需引入。
  - @veltra/utils@1.0.12
  - @veltra/styles@1.0.12
  - @veltra/compositions@1.0.12
  - @veltra/directives@1.0.12
  - @veltra/icons@1.0.12

## 1.0.11

### Patch Changes

- 0b04546: 优化文件预览组件,样式更美观,体验更好
- 8992a55: 优化 code-editor 组件, 使用 one-dark 主题
  - @veltra/utils@1.0.11
  - @veltra/styles@1.0.11
  - @veltra/compositions@1.0.11
  - @veltra/directives@1.0.11
  - @veltra/icons@1.0.11

## 1.0.10

### Patch Changes

- f1bce93: 优化 tabs 组件样式
- Updated dependencies [f1bce93]
  - @veltra/styles@1.0.10
  - @veltra/directives@1.0.10
  - @veltra/utils@1.0.10
  - @veltra/compositions@1.0.10
  - @veltra/icons@1.0.10

## 1.0.9

### Patch Changes

- 81dbe41: 重构 use-lock -> use-user-action, 更加符合直觉
- 组件优化
- Updated dependencies
- Updated dependencies [81dbe41]
- Updated dependencies
  - @veltra/compositions@1.0.9
  - @veltra/directives@1.0.9
  - @veltra/styles@1.0.9
  - @veltra/icons@1.0.9
  - @veltra/utils@1.0.9

## 1.0.8

### Patch Changes

- f758a81: 修复样式问题
- Updated dependencies [f758a81]
  - @veltra/compositions@1.0.8
  - @veltra/directives@1.0.8
  - @veltra/styles@1.0.8
  - @veltra/icons@1.0.8
  - @veltra/utils@1.0.8

## 1.0.7

### Patch Changes

- a91e7a8: 新增面包屑组件
- Updated dependencies [a91e7a8]
  - @veltra/compositions@1.0.7
  - @veltra/directives@1.0.7
  - @veltra/icons@1.0.7
  - @veltra/styles@1.0.7
  - @veltra/utils@1.0.7

## 1.0.6

### Patch Changes

- ab2d8e6: 新增一个 vite 包
- Updated dependencies [ab2d8e6]
  - @veltra/compositions@1.0.6
  - @veltra/directives@1.0.6
  - @veltra/icons@1.0.6
  - @veltra/styles@1.0.6
  - @veltra/utils@1.0.6

## 1.0.5

### Patch Changes

- Updated dependencies
  - @veltra/icons@1.0.5
  - @veltra/utils@1.0.5
  - @veltra/styles@1.0.5
  - @veltra/compositions@1.0.5
  - @veltra/directives@1.0.5

## 1.0.4

### Patch Changes

- Fix published subpath exports so npm consumers resolve wildcard entries to the correct built files.
- Updated dependencies
  - @veltra/directives@1.0.4
  - @veltra/utils@1.0.4
  - @veltra/compositions@1.0.4
  - @veltra/styles@1.0.4
  - @veltra/icons@1.0.4

## 1.0.3

### Patch Changes

- Fix published package manifests to strip `exports.development` conditions from npm tarballs during release.
- Updated dependencies
  - @veltra/utils@1.0.3
  - @veltra/styles@1.0.3
  - @veltra/compositions@1.0.3
  - @veltra/directives@1.0.3
  - @veltra/icons@1.0.3

## 1.0.2

### Patch Changes

- 修复发布流程，确保发布到 npm 的内部包依赖不会保留 `workspace:*`，而是展开为对应版本号。
- Updated dependencies
  - @veltra/utils@1.0.2
  - @veltra/styles@1.0.2
  - @veltra/compositions@1.0.2
  - @veltra/directives@1.0.2
  - @veltra/icons@1.0.2

## 1.0.1

### Patch Changes

- 将 playground、移动端占位与内部 CLI 标为 `private`，避免 `changeset publish` 误发布；发布 1.0.1。
  - @veltra/utils@1.0.1
  - @veltra/styles@1.0.1
  - @veltra/compositions@1.0.1
  - @veltra/directives@1.0.1
  - @veltra/icons@1.0.1
