# AGENTS.md — @ultra-ui/utils

工具函数、共享类型与样式系统基础包。是整个组件库的底层依赖，不含任何 Vue 组件。

## 目录结构

```
src/
├── index.ts              # 聚合导出 utils + shared + types
├── utils/                # 工具函数
│   ├── dom/              # DOM 操作（class-name, highlight, position, style, z-index）
│   ├── form/validate     # 表单校验
│   ├── helper/           # 通用辅助（make-bem, tween, frame, create-increase, create-toggle, data-compat, vue）
│   └── reactive/proxy    # 响应式代理工具
├── shared/               # 共享常量（FORM_EMPTY_CONTENT 等）
├── types/                # 类型定义
│   ├── index.ts          # 聚合导出
│   ├── helper.ts         # 辅助类型
│   ├── component-common.ts # 组件公共类型（Size, FormComponentProps 等）
│   ├── form-context.ts   # 表单上下文类型
│   └── utils/            # 工具相关类型
└── styles/               # 样式系统
    ├── _vars.scss        # 命名空间变量（$namespace: 'u-'）
    ├── _mixins.scss      # BEM mixins（b/e/m/em/is）
    ├── _functions.scss   # CSS 变量函数（use-var, component-var）
    ├── normalize.scss    # 全局归一化样式
    ├── index.ts          # 样式入口（引入 normalize）
    ├── theme.ts          # 主题 API 入口（UITheme, lightTheme, darkTheme, setTheme, currentTheme）
    ├── type.ts           # Theme 全局 token 类型定义
    ├── helper.ts         # 样式辅助
    ├── theme/            # 主题实现
    │   ├── ui-theme.ts   # UITheme 类（序列化为 --u-* CSS 变量，render 优先 adoptedStyleSheets）
    │   ├── light.ts      # 内置亮色主题预设
    │   └── dark.ts       # 内置暗色主题预设
    └── anime/            # 动画 SCSS（fade, slide, spring, zoom-in）
```

## 导出子路径

| 子路径 | 用途 |
| ------ | ---- |
| `@ultra-ui/utils` | 工具函数 + 共享 + 类型聚合 |
| `@ultra-ui/utils/types` | 仅类型（含 `component-common`、`helper` 等子路径） |
| `@ultra-ui/utils/styles` | 样式入口（normalize 等副作用） |
| `@ultra-ui/utils/styles/theme` | 主题 API（`UITheme`、`setTheme`、`lightTheme`/`darkTheme`） |
| `@ultra-ui/utils/styles/*` | SCSS 文件直接访问（含 `sass` 条件） |
| `@ultra-ui/utils/shared` | 共享常量 |

## 样式系统

### BEM + SCSS

```scss
@use 'utils/src/styles/mixins' as m;
@use 'utils/src/styles/vars';
@use 'utils/src/styles/functions' as fn;

@include m.b(component-name) {
  color: fn.use-var(text-color, main); // → var(--u-text-color-main)
  @include m.e(element) { }
  @include m.m(modifier) { }
  @include m.is(active) { }
}
```

- 命名空间 `$namespace: 'u-'`，BEM 分隔符 `__`（element）、`--`（modifier）
- 组件级 CSS 变量：`fn.component-var()` + `m.dark()` 覆盖暗色
- 构建/预览时 Sass `loadPaths` 必须包含 `packages/`，以解析 `utils/src/styles/...`

### 主题 API

```ts
import { UITheme, setTheme, lightTheme, darkTheme, currentTheme } from '@ultra-ui/utils/styles/theme'

setTheme('light' | 'dark' | 'auto')  // 设置 html[data-theme]

// UITheme.render() 优先 adoptedStyleSheets，回退 <style id="ultra-ui-theme">
```

- 全局 `Theme` token 类型定义在 `styles/type.ts`
- 组件级 token 在各组件 `style.scss` 中以 `--u-{component}-*` 声明

## 关键工具函数

| 模块 | 导出 | 用途 |
| ---- | ---- | ---- |
| `helper/make-bem` | `bem()` | 创建 BEM 类名工具实例 |
| `helper/tween` | `Tween` | 补间动画 |
| `helper/frame` | `frame` | requestAnimationFrame 封装 |
| `helper/vue` | Vue 相关辅助 | — |
| `dom/z-index` | z-index 管理 | — |
| `dom/position` | 位置计算 | — |
| `form/validate` | 表单校验 | — |
| `reactive/proxy` | 响应式代理 | — |

## 依赖

- **依赖**：`@cat-kit/core`
- **peer**：`vue ^3.5.0`
- **被依赖**：compositions、directives、desktop
