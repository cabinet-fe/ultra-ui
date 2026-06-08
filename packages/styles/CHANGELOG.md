# @veltra/styles

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
