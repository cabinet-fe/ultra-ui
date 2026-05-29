# AGENTS.md — @veltra/styles

共享 SCSS（BEM mixins、vars、functions）与主题系统（`@veltra/styles/theme`）。

## 目录结构

```
src/
├── _mixins.scss          # BEM、暗色、布局等 mixins
├── _vars.scss            # 命名空间、分隔符等 SCSS 变量
├── _functions.scss       # use-var、component-var 等
├── normalize/            # 规范化样式（@veltra/styles/normalize）
├── transitions/          # Vue 过渡预设（fade、slide、zoom-in、spring）
└── theme/                # 主题 TS（presets、load-theme、ui-theme）
    ├── index.ts
    ├── load-theme.ts
    ├── ui-theme.ts
    └── presets/          # light、dark、shadcn、hero、glass
```

## 导出子路径

| 子路径                         | 用途                        |
| ------------------------------ | --------------------------- |
| `@veltra/styles/normalize`     | 规范化 CSS                  |
| `@veltra/styles/transitions`   | 全部过渡样式                |
| `@veltra/styles/transitions/*` | 单个过渡                    |
| `@veltra/styles/theme`         | 主题 preset 与 `loadTheme`  |
| `@veltra/styles/*`             | SCSS partial（sass export） |

## Sass 用法

组件/指令样式中：

```scss
@use 'pkg:@veltra/styles/mixins' as m;
@use 'pkg:@veltra/styles/vars';
@use 'pkg:@veltra/styles/functions' as fn;
```

构建与 playground 需在 Vite/sass 中配置 `NodePackageImporter`（入口目录为 monorepo 根）。

## 主题

`@veltra/styles/theme` 运行时依赖 `@veltra/compositions` 的 `useConfig`。**compositions 不得 re-export theme**，避免与 styles 循环依赖。

## 依赖

- **peer**：`@cat-kit/core`、`@veltra/compositions`、`@veltra/utils`、`vue`
- **被依赖**：`@veltra/directives`、`@veltra/desktop`、`playgrounds/desktop`

## 验证

```bash
bun run lint
vp test -F @veltra/styles
vp pack -F @veltra/styles
```
