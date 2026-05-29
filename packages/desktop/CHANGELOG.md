# @veltra/desktop

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
