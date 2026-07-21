# @veltra/styles

## 1.3.2

### Patch Changes

- @veltra/utils@1.3.2
- @veltra/compositions@1.3.2

## 1.3.1

### Patch Changes

- f6c2fc6: 优化默认主题视觉细节：圆角阶梯从 4/6/8 调整为 6/8/12（对齐 Tailwind rounded-md/lg/xl）；卡片内边距收紧为 8/12/16 并使用 12px 圆角（新增 `--u-card-radius` token）；区分结构边框与控件描边（light 控件描边加深为 `#d4d4d8`，dark 整体提亮），修复 hero 主题 muted 边框透明、glass 主题亮色边框不可见的问题；焦点环统一使用 `--u-focus-ring` token（breadcrumb、condition-editor、rich-text-editor），并修复 button plain/text 变体覆盖焦点环的层叠问题。
  - @veltra/utils@1.3.1
  - @veltra/compositions@1.3.1

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

- @veltra/utils@1.3.0
- @veltra/compositions@1.3.0

## 1.2.34

### Patch Changes

- @veltra/utils@1.2.34
- @veltra/compositions@1.2.34

## 1.2.33

### Patch Changes

- @veltra/utils@1.2.33
- @veltra/compositions@1.2.33

## 1.2.32

### Patch Changes

- @veltra/utils@1.2.32
- @veltra/compositions@1.2.32

## 1.2.31

### Patch Changes

- @veltra/utils@1.2.31
- @veltra/compositions@1.2.31

## 1.2.30

### Patch Changes

- @veltra/utils@1.2.30
- @veltra/compositions@1.2.30

## 1.2.29

### Patch Changes

- @veltra/utils@1.2.29
- @veltra/compositions@1.2.29

## 1.2.28

### Patch Changes

- @veltra/utils@1.2.28
- @veltra/compositions@1.2.28

## 1.2.27

### Patch Changes

- @veltra/utils@1.2.27
- @veltra/compositions@1.2.27

## 1.2.26

### Patch Changes

- @veltra/utils@1.2.26
- @veltra/compositions@1.2.26

## 1.2.25

### Patch Changes

- Updated dependencies [e6a0721]
  - @veltra/utils@1.2.25
  - @veltra/compositions@1.2.25

## 1.2.24

### Patch Changes

- @veltra/utils@1.2.24
- @veltra/compositions@1.2.24

## 1.2.23

### Patch Changes

- @veltra/utils@1.2.23
- @veltra/compositions@1.2.23

## 1.2.22

### Patch Changes

- @veltra/utils@1.2.22
- @veltra/compositions@1.2.22

## 1.2.21

### Patch Changes

- @veltra/utils@1.2.21
- @veltra/compositions@1.2.21

## 1.2.20

### Patch Changes

- @veltra/utils@1.2.20
- @veltra/compositions@1.2.20

## 1.2.19

### Patch Changes

- @veltra/utils@1.2.19
- @veltra/compositions@1.2.19

## 1.2.18

### Patch Changes

- @veltra/utils@1.2.18
- @veltra/compositions@1.2.18

## 1.2.17

### Patch Changes

- @veltra/utils@1.2.17
- @veltra/compositions@1.2.17

## 1.2.16

### Patch Changes

- @veltra/utils@1.2.16
- @veltra/compositions@1.2.16

## 1.2.15

### Patch Changes

- @veltra/utils@1.2.15
- @veltra/compositions@1.2.15

## 1.2.14

### Patch Changes

- 457b117: 从 @veltra/styles/theme 导出主题工具函数（HEXToRGB、mixColor、defineBySize、cssVar）
  - @veltra/utils@1.2.14
  - @veltra/compositions@1.2.14

## 1.2.13

### Patch Changes

- @veltra/utils@1.2.13
- @veltra/compositions@1.2.13

## 1.2.12

### Patch Changes

- @veltra/utils@1.2.12
- @veltra/compositions@1.2.12

## 1.2.11

### Patch Changes

- @veltra/utils@1.2.11
- @veltra/compositions@1.2.11

## 1.2.10

### Patch Changes

- @veltra/utils@1.2.10
- @veltra/compositions@1.2.10

## 1.2.9

### Patch Changes

- @veltra/utils@1.2.9
- @veltra/compositions@1.2.9

## 1.2.8

### Patch Changes

- @veltra/utils@1.2.8
- @veltra/compositions@1.2.8

## 1.2.7

### Patch Changes

- @veltra/utils@1.2.7
- @veltra/compositions@1.2.7

## 1.2.6

### Patch Changes

- @veltra/utils@1.2.6
- @veltra/compositions@1.2.6

## 1.2.5

### Patch Changes

- @veltra/utils@1.2.5
- @veltra/compositions@1.2.5

## 1.2.4

### Patch Changes

- @veltra/utils@1.2.4
- @veltra/compositions@1.2.4

## 1.2.3

### Patch Changes

- @veltra/utils@1.2.3
- @veltra/compositions@1.2.3

## 1.2.2

### Patch Changes

- @veltra/utils@1.2.2
- @veltra/compositions@1.2.2

## 1.2.1

### Patch Changes

- Updated dependencies [acadad3]
  - @veltra/utils@1.2.1
  - @veltra/compositions@1.2.1

## 1.2.0

### Patch Changes

- Updated dependencies [a9b9eff]
  - @veltra/utils@1.2.0
  - @veltra/compositions@1.2.0

## 1.1.36

### Patch Changes

- @veltra/utils@1.1.36
- @veltra/compositions@1.1.36

## 1.1.35

### Patch Changes

- 08fc992: Dialog: 新增 `transition` 属性支持自定义过渡动画，默认使用 `fade-scale`（macOS 风格平滑缩放），清理未使用的模板引用；新增 `fade-scale` 过渡样式。
  - @veltra/utils@1.1.35
  - @veltra/compositions@1.1.35

## 1.1.34

### Patch Changes

- @veltra/utils@1.1.34
- @veltra/compositions@1.1.34

## 1.1.33

### Patch Changes

- @veltra/utils@1.1.33
- @veltra/compositions@1.1.33

## 1.1.32

### Patch Changes

- @veltra/utils@1.1.32
- @veltra/compositions@1.1.32

## 1.1.31

### Patch Changes

- @veltra/utils@1.1.31
- @veltra/compositions@1.1.31

## 1.1.30

### Patch Changes

- @veltra/utils@1.1.30
- @veltra/compositions@1.1.30

## 1.1.29

### Patch Changes

- @veltra/utils@1.1.29
- @veltra/compositions@1.1.29

## 1.1.28

### Patch Changes

- @veltra/utils@1.1.28
- @veltra/compositions@1.1.28

## 1.1.27

### Patch Changes

- @veltra/utils@1.1.27
- @veltra/compositions@1.1.27

## 1.1.26

### Patch Changes

- 7ef551a: 重构 SCSS 模块中 $namespace 变量的定义位置，将其从 \_vars.scss 移至 \_functions.scss 和 \_mixins.scss，消除潜在的循环依赖问题
  - @veltra/utils@1.1.26
  - @veltra/compositions@1.1.26

## 1.1.25

### Patch Changes

- @veltra/utils@1.1.25
- @veltra/compositions@1.1.25

## 1.1.24

### Patch Changes

- 767edb6: 修正 `sideEffects` 声明，避免 normalize/transitions 等按需样式在打包时被 tree-shake 掉。
  - @veltra/utils@1.1.24
  - @veltra/compositions@1.1.24

## 1.1.23

### Patch Changes

- @veltra/utils@1.1.23
- @veltra/compositions@1.1.23

## 1.1.22

### Patch Changes

- @veltra/utils@1.1.22
- @veltra/compositions@1.1.22

## 1.1.21

### Patch Changes

- @veltra/utils@1.1.21
- @veltra/compositions@1.1.21

## 1.1.20

### Patch Changes

- @veltra/utils@1.1.20
- @veltra/compositions@1.1.20

## 1.1.19

### Patch Changes

- e63faf1: normalize 为 ul、li 补充 box-sizing: border-box
  - @veltra/utils@1.1.19
  - @veltra/compositions@1.1.19

## 1.1.18

### Patch Changes

- 503ad2b: 重构条件编辑器数据模型与求值机制；@cat-kit/\* 依赖结构调整为 peerDependencies；各类构建配置与类型修复
- Updated dependencies [503ad2b]
  - @veltra/utils@1.1.18
  - @veltra/compositions@1.1.18

## 1.1.17

### Patch Changes

- 5bd35b3: 修复 tsdown 构建入口路径，将 anime 替换为 transitions 和 normalize
  - @veltra/utils@1.1.17
  - @veltra/compositions@1.1.17

## 1.1.16

### Patch Changes

- ab50e27: 移除 `theme` 子路径中不再推荐对外使用的 `component-css-vars` 重导出；修正 `anime` → `transitions` 引用路径
  - @veltra/utils@1.1.16
  - @veltra/compositions@1.1.16

## 1.1.15

### Patch Changes

- @veltra/utils@1.1.15
- @veltra/compositions@1.1.15

## 1.1.14

### Patch Changes

- @veltra/utils@1.1.14
- @veltra/compositions@1.1.14

## 1.1.13

### Patch Changes

- @veltra/utils@1.1.13
- @veltra/compositions@1.1.13

## 1.1.12

### Patch Changes

- df8bd87: 修复 Collapse 标题颜色引用错误，改用组件级 CSS 变量；修正字号令牌引用
  - @veltra/utils@1.1.12
  - @veltra/compositions@1.1.12

## 1.1.11

### Patch Changes

- @veltra/utils@1.1.11
- @veltra/compositions@1.1.11

## 1.1.10

### Patch Changes

- @veltra/utils@1.1.10
- @veltra/compositions@1.1.10

## 1.1.9

### Patch Changes

- ca68f74: chore: republish all packages since 1.1.8 was not published
- Updated dependencies [ca68f74]
  - @veltra/utils@1.1.9
  - @veltra/compositions@1.1.9

## 1.1.8

### Patch Changes

- @veltra/utils@1.1.8
- @veltra/compositions@1.1.8

## 1.1.7

### Patch Changes

- cc1d822: 优化基础主题配置与组件样式细节，增加并优化按钮、树形控件、级联选择器、表达式编辑器芯片、分页器、标签等组件在亮色/暗色及 Shadcn 主题下的样式表现与 CSS 变量定制支持。
  - @veltra/utils@1.1.7
  - @veltra/compositions@1.1.7

## 1.1.6

### Patch Changes

- @veltra/utils@1.1.6
- @veltra/compositions@1.1.6

## 1.1.5

### Patch Changes

- Updated dependencies [14c03c0]
  - @veltra/compositions@1.1.5
  - @veltra/utils@1.1.5

## 1.1.4

### Patch Changes

- @veltra/utils@1.1.4
- @veltra/compositions@1.1.4

## 1.1.3

### Patch Changes

- Updated dependencies
  - @veltra/utils@1.1.3
  - @veltra/compositions@1.1.3

## 1.1.2

### Patch Changes

- ef0ef2d: Refine shared expand transitions and related component/theme behavior.
- Updated dependencies [ef0ef2d]
  - @veltra/utils@1.1.2
  - @veltra/compositions@1.1.2

## 1.1.1

### Patch Changes

- a9e4a86: 修复 `@veltra/styles` 构建产物导出路径，将 `import` 与 `default` 条件正确指向 `dist/` 目录；新增 `normalize.ts` 与 `anime/index.ts` 入口文件以支持独立导入；更新 `tsdown.config.ts` 构建入口。
  - @veltra/utils@1.1.1
  - @veltra/compositions@1.1.1

## 1.1.0

### Minor Changes

- dad6fef: refactor: replace hardcoded backdrop-filter with bg-filter CSS variable across components; add `is-not` SCSS mixin for cleaner disabled state selectors; improve input clearable/suffix interaction; add number-input clearable support; fix badge type safety; fix palette clear alpha bug; fix select displayed value; fix progress-nodes border color token; adjust hero/shadcn/glass themes

### Patch Changes

- @veltra/utils@1.1.0
- @veltra/compositions@1.1.0

## 1.0.15

### Patch Changes

- @veltra/utils@1.0.15
- @veltra/compositions@1.0.15

## 1.0.14

### Patch Changes

- 3da006a: - desktop: 重写 expression-editor，移除 lexical 依赖；batch-edit 合并精简实现
  - desktop: action / cascade / code-editor / dialog / layout / number-input / table / tree 体验与样式细节优化
  - icons: 新增 dot 图标
  - styles: 调整 spring 动效曲线
  - compositions: 精简 use-drag 内部实现
- Updated dependencies [3da006a]
  - @veltra/compositions@1.0.14
  - @veltra/utils@1.0.14

## 1.0.13

### Patch Changes

- @veltra/utils@1.0.13
- @veltra/compositions@1.0.13

## 1.0.12

### Patch Changes

- @veltra/utils@1.0.12
- @veltra/compositions@1.0.12

## 1.0.11

### Patch Changes

- @veltra/utils@1.0.11
- @veltra/compositions@1.0.11

## 1.0.10

### Patch Changes

- f1bce93: 修复样式导入入口副作用丢失的问题
  - @veltra/utils@1.0.10
  - @veltra/compositions@1.0.10

## 1.0.9

### Patch Changes

- 81dbe41: 重构 use-lock -> use-user-action, 更加符合直觉
- 组件优化
- Updated dependencies
- Updated dependencies [81dbe41]
- Updated dependencies
  - @veltra/compositions@1.0.9
  - @veltra/utils@1.0.9

## 1.0.8

### Patch Changes

- f758a81: 修复样式问题
- Updated dependencies [f758a81]
  - @veltra/compositions@1.0.8
  - @veltra/utils@1.0.8

## 1.0.7

### Patch Changes

- a91e7a8: 新增面包屑组件
- Updated dependencies [a91e7a8]
  - @veltra/compositions@1.0.7
  - @veltra/utils@1.0.7

## 1.0.6

### Patch Changes

- ab2d8e6: 新增一个 vite 包
- Updated dependencies [ab2d8e6]
  - @veltra/compositions@1.0.6
  - @veltra/utils@1.0.6

## 1.0.5

### Patch Changes

- @veltra/utils@1.0.5
- @veltra/compositions@1.0.5

## 1.0.4

### Patch Changes

- Updated dependencies
  - @veltra/utils@1.0.4
  - @veltra/compositions@1.0.4

## 1.0.3

### Patch Changes

- Fix published package manifests to strip `exports.development` conditions from npm tarballs during release.
- Updated dependencies
  - @veltra/utils@1.0.3
  - @veltra/compositions@1.0.3

## 1.0.2

### Patch Changes

- 修复发布流程，确保发布到 npm 的内部包依赖不会保留 `workspace:*`，而是展开为对应版本号。
- Updated dependencies
  - @veltra/utils@1.0.2
  - @veltra/compositions@1.0.2

## 1.0.1

### Patch Changes

- @veltra/utils@1.0.1
- @veltra/compositions@1.0.1
