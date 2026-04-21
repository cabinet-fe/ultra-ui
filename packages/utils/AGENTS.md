# AGENTS.md — @veltra/utils

工具函数、共享类型包。是整个组件库的底层依赖，不含任何 Vue 组件。共享 SCSS（BEM partial、normalize、动画）与主题 TS（`@veltra/styles/theme`）在 `**@veltra/styles**`。

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
```

## 导出子路径

| 子路径                 | 用途                       |
| ---------------------- | -------------------------- |
| `@veltra/utils`        | 工具函数 + 共享 + 类型聚合 |
| `@veltra/utils/shared` | 共享常量                   |

## BEM + SCSS

组件与指令的样式文件使用 `**@veltra/styles**`，Sass 侧写 `pkg:`（详见 `packages/styles/AGENTS.md`）：

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/vars';
@use 'pkg:@veltra/styles/functions' as fn;

@include m.b(component-name) {
  color: fn.use-var(text-color, main); // → var(--u-text-color-main)
  @include m.e(element) {
  }
  @include m.m(modifier) {
  }
  @include m.is(active) {
  }
}
```

- 命名空间 `$namespace: 'u-'`，BEM 分隔符 `__`（element）、`--`（modifier）
- 组件级 CSS 变量：`fn.component-var()` + `m.dark()` 覆盖暗色
- 编译入口需启用 `NodePackageImporter`（入口目录为 monorepo 根），以解析 `pkg:@veltra/styles/...`
- 组件级 token 在各组件 `style.scss` 中以 `--u-{component}-*` 声明

## 关键工具函数

| 模块              | 导出         | 用途                       |
| ----------------- | ------------ | -------------------------- |
| `helper/make-bem` | `bem()`      | 创建 BEM 类名工具实例      |
| `helper/tween`    | `Tween`      | 补间动画                   |
| `helper/frame`    | `frame`      | requestAnimationFrame 封装 |
| `helper/vue`      | Vue 相关辅助 | —                          |
| `dom/z-index`     | z-index 管理 | —                          |
| `dom/position`    | 位置计算     | —                          |
| `form/validate`   | 表单校验     | —                          |
| `reactive/proxy`  | 响应式代理   | —                          |

## 依赖

- **依赖**：`@cat-kit/core`
- **peer**：`vue ^3.5.0`
- **被依赖**：compositions、directives、desktop（样式资产由 `@veltra/styles` 单独提供）
