# AGENTS.md — @veltra/styles

共享 SCSS（BEM mixins、vars、functions）与主题系统（`@veltra/styles/theme`）。

## 目录结构

```
src/
├── _mixins.scss          # BEM、暗色、布局等 mixins
├── _vars.scss            # 命名空间、分隔符等 SCSS 变量
├── _functions.scss       # use-var、component-var、color-a 等
├── animations/           # 全局动画工具类（@veltra/styles/animations，如 u-shine 文字扫光）
├── normalize/            # 规范化样式（@veltra/styles/normalize）
├── transitions/          # Vue 过渡预设（fade、slide、zoom-in、spring）
└── theme/                # 主题 TS（presets、load-theme、ui-theme）
    ├── index.ts
    ├── load-theme.ts
    ├── ui-theme.ts
    └── presets/          # light、dark、hero、glass（深色）、ancient、sakura、ocean、midnight（深色）、neon（深色）
```

## 导出子路径

| 子路径                       | 用途                                  |
| ---------------------------- | ------------------------------------- |
| `@veltra/styles/normalize`   | 规范化 CSS                            |
| `@veltra/styles/transitions` | 全部过渡样式                          |
| `@veltra/styles/animations`  | 全部动画工具类                        |
| `@veltra/styles/theme`       | 主题 preset 与 `loadTheme`            |
| `@veltra/styles/*`           | SCSS partial（sass export）/ 单个样式 |

动画工具类为全局类，按需引入单个文件（如 `import '@veltra/styles/animations/shine.scss'`）：

- `u-shine`：文字扫光（background-clip: text，`--u-shine-duration` 可覆盖时长，默认 2.4s，含 prefers-reduced-motion 降级）

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

侧栏导航（nav / dual-nav / group-nav）外观：主题 `nav.variant`（`dark` 深底浅字 / `light` 浅底深字，默认 `dark`）选择 `component-css-vars.ts` 中「变体 × 系列」内置 token 组，主题 `nav` 的其余键作为 `--u-nav-*` 覆盖追加在最后（优先级最高）；preset 可用该机制定义侧栏个性色（如 sakura 深酒红）。

## 依赖

- **peer**：`@cat-kit/core`、`@veltra/compositions`、`@veltra/utils`、`vue`
- **被依赖**：`@veltra/directives`、`@veltra/desktop`、`playground`

## sideEffects

`package.json` 中声明：

- `**/*.css`、`**/*.scss`：样式文件本体（含按需 `import '@veltra/styles/transitions/fade.scss'`）
- `src|dist` 下 `animations/index`、`normalize/index`、`transitions/index`：仅副作用的聚合入口（内部 `import` 对应 CSS）

`theme` 子路径为可 tree-shake 的 TS，不列入 sideEffects。

## 验证

```bash
bun run lint
vp test -F @veltra/styles
vp pack -F @veltra/styles
```
