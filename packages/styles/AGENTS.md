# AGENTS.md — @veltra/styles

共享样式与设计 token：SCSS 侧为 BEM 基础设施（`vars` / `mixins` / `functions`）、全局 `normalize.scss`、过渡动画 `anime/*`；TS 侧子路径 `@veltra/styles/theme` 提供 `UITheme`、`loadTheme`、`lightTheme` / `darkTheme`、`Theme` 类型与颜色辅助（`loadTheme` 内部使用 `@veltra/compositions` 的 `useConfig` 同步文档尺寸类名）。

## 在组件 SCSS 中引用（推荐）

使用 Dart Sass **`pkg:`** 与包名子路径，由 `NodePackageImporter` + `package.json` 的 `exports`（含 `"sass"` 条件）解析：

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/functions' as fn;
@use 'pkg:@veltra/styles/vars';

@include m.b(foo) {
  color: fn.use-var(text-color, main);
}
```

本包**内部** partial 之间仍用同目录相对名（如 `@use 'vars'`、`@use 'mixins'`），不强制 `pkg:`。

## 在 TypeScript 中引入全局样式

`pkg:` **仅**用于 Sass 的 `@use` / `@forward`。TS 侧用包导出路径，由 bundler / Node 解析：

```ts
import '@veltra/styles/normalize'
import '@veltra/styles/anime/fade.scss'
```

全量 样式 副作用入口：`@veltra/styles`（`src/index.ts` 引入 `normalize.scss` 和 `anime/*.scss`）。

## `exports` 子路径（摘要）

| 子路径                        | 说明                                                    |
| ----------------------------- | ------------------------------------------------------- |
| `@veltra/styles`              | 通用样式全量导入                                        |
| `@veltra/styles/normalize`    | 全局 normalize                                          |
| `@veltra/styles/mixins`       | `sass` → `_mixins.scss`                                 |
| `@veltra/styles/vars`         | `sass` → `_vars.scss`                                   |
| `@veltra/styles/functions`    | `sass` → `_functions.scss`                              |
| `@veltra/styles/anime/*.scss` | 过渡动画                                                |
| `@veltra/styles/theme`        | 主题运行时（`loadTheme`、`UITheme`、预设与 token 类型） |

## 依赖

- **TS 主题**：`peer` `vue`；`dependencies`：`@cat-kit/core`、`@veltra/utils`、`@veltra/compositions`（仅 `useConfig`）。
- **SCSS**：消费方需在 Sass 编译配置中启用 `NodePackageImporter`（入口目录建议为 monorepo 根）。
