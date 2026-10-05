# AGENTS.md — @veltra/mobile

移动端 UI 组件库（Vue 3，`um-` BEM 前缀，API 与 desktop 同名组件对齐、按 NutUI 移动惯例允许分叉）。

## 目录结构

```
src/
├── index.ts
├── styles/
│   └── _tokens.scss      # --um-* 密度 token 值表（编译期回退值的单一来源）
└── components/
    ├── <name>/
    │   ├── <name>.vue
    │   ├── index.ts      # export U<PascalName>
    │   ├── style.scss    # 组件样式（BEM，非 scoped）
    │   └── style.ts      # import './style.scss'
    └── _internal/        # 不对外导出的内部组件（bottom-sheet 等）
```

## 长度单位约定（核心）

库输出**纯 CSS px**（设计基准 375 CSS px 视口），不引入 rem / vw / rpx，也不配 postcss 单位转换。宿主需要 viewport 适配时，在自己构建链加 postcss-px-to-viewport / postcss-mobile-forever（`viewportWidth: 375`），或直接覆盖 `--um-*` 变量调整密度。单位与值的取用规则：

- **密度值（字号 / 高度 / 间距 / 圆角 / 热区）一律经 `t.use-var()` 取 `--um-*` token**（`@use '../../styles/tokens' as t`），禁止裸写等值 px（同值不同源会让宿主覆盖失效）。无对应 token 时先在 `_tokens.scss` 加档，不临时硬编码。
- **观感值（颜色 / 阴影 / 过渡 / 焦点环）走 `--u-*`**（`fn.use-var(...)`），但**圆角除外**——圆角属密度：控件类走 `t.control-radius(small|default|large)`（4 / 6 / 8），弹层与浮层容器（dialog / drawer / bottom-sheet / message / card）走 `t.use-var('panel-radius')`（12）。mobile 包内**禁止引用桌面 `--u-radius`**，两张表刻意分开。
- 间距刻度 4px 基（`--um-spacing-*`：4 / 8 / 12 / 16 / 24）；1px 边框、2px 描边类小值可裸写。新值必须落在刻度上，不造 10 / 14 / 104 这类孤值。
- 胶囊圆角统一 `999px`（或“高度一半”公式），不用 100px / 9999px 等变体。
- 图标随字号：svg 一律 `1em`，不写死图标 px。
- 触控热区 ≥44×44 用 `t.use-var('touch-target')`；与脚本常量耦合的除外（time-picker 滚轮 `ITEM_HEIGHT`，见其 style.scss 注释）。
- 负 margin 外扩（清除 / 关闭钮热区补偿）写成 `calc(-1 * #{t.use-var('spacing-*')})`，不裸写 `-8px`。

## 字号档语义

| token | 值 | 用途 |
| --- | --- | --- |
| `font-size-main` | 16 | 正文 / 输入类字号（不小于 16，iOS 聚焦防缩放） |
| `font-size-secondary` | 14 | 辅助信息 / 标签 |
| `font-size-auxiliary` | 12 | 弱信息 |
| `font-size-title` | 18 | 底部弹层头部主标题、滚轮等大号主内容；日历面板内部标题用 main |

## 样式约定

- 同 desktop：不硬编码颜色 / 阴影，暗色走 token，组件内不写 `[data-theme]` 分支；焦点指示统一 `:focus-visible` + `focus-ring`。
- 触控反馈用 `:active`（移动端无 hover）。

## 新增组件

1. `components/<name>/`：`*.vue`、`index.ts`、`style.scss`、`style.ts`
2. `playground/src/mobile/<name>/index.vue` 演示页，`nav-config.ts` 登记
3. 仓库根 `bun run resolver:gen`（若需按需解析）

## 验证

```bash
bun run lint && bun run test
cd playground && vp dev    # device-frame 内目检表单族圆角 / 弹层 / 胶囊形状
```
