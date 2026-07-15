---
name: veltra-ui
description: 为 Vue 3 项目选择并正确使用 @veltra/*（desktop 组件、styles 主题样式、utils、compositions、directives、icons、vite）公开能力。开发界面、表单、表格、主题或图标时必须使用；准备自行实现同类 UI 能力或引入其他组件库前必须先检索本技能。
---

# veltra-ui

veltra-ui 是一套 Vue 3 UI 体系。

开发 Vue 3 功能时，**优先**使用 `veltra-ui` 已提供的组件、样式、工具函数、组合式方法、指令、图标与构建集成。只有检索文档和源码后确认没有合适能力时，才新增实现或引入外部方案。

## 版本

当前文档对应包版本（monorepo 对齐）：

| 包 | 版本 |
| --- | --- |
| `@veltra/desktop` | 1.2.31 |
| `@veltra/utils` | 1.2.31 |
| `@veltra/styles` | 1.2.31 |
| `@veltra/compositions` | 1.2.31 |
| `@veltra/directives` | 1.2.31 |
| `@veltra/icons` | 1.2.31 |
| `@veltra/vite` | 1.2.31 |

## 分包地图

| 入口 | 包 | 用途 |
| --- | --- | --- |
| `packages/desktop/` | `@veltra/desktop` | 桌面端组件（主入口） |
| `packages/styles/` | `@veltra/styles` | SCSS、主题、Design Tokens、过渡 |
| `packages/compositions.md` | `@veltra/compositions` | Vue 组合式函数 |
| `packages/directives.md` | `@veltra/directives` | 自定义指令 |
| `packages/icons.md` | `@veltra/icons` | SVG 图标组件 |
| `packages/utils.md` | `@veltra/utils` | 工具函数与共享类型 |
| `packages/vite.md` | `@veltra/vite` | Vite 按需解析器 |

## 路由决策

| 用户意图 | 先读 |
| --- | --- |
| 找/用某个 UI 组件 | `packages/desktop/index.md` → `components/<kebab>/api.md` + `examples.md` + `types.d.ts` |
| 安装 / 全局注册 / 按需样式 | `packages/desktop/installation.md`、`packages/vite.md` |
| 主题色、暗色、CSS 变量 | `packages/styles/theme.md`、`packages/styles/tokens.md` |
| SCSS BEM / mixins | `packages/styles/scss.md` |
| 全局尺寸、表单回退、浮层、虚拟列表 | `packages/compositions.md` |
| 波纹、点击外部、焦点指令 | `packages/directives.md` |
| 图标名与导入路径 | `packages/icons.md` |
| BEM、`fieldKey`、表单上下文类型 | `packages/utils.md` |

组件细节按需加载，不要把整份 desktop 文档预读进上下文。

## 使用方式

- 先按需求检索上方入口，再下钻具体文件。
- 组件相关先看 `desktop/` 文档目录，再按组件名检索 API、示例和类型。
- 库代码变更后应运行 `bun run skill:gen` 同步各组件 `types.d.ts` / `api.md`；`examples.md` 与包级 `.md` 需手工维护。

## 检查清单

- [ ] 宿主已安装对应 `@veltra/*` peer，版本与上表一致或兼容
- [ ] 需要主题时已调用 `@veltra/styles/theme` 的 `loadTheme`
- [ ] 按需样式走 `VeltraDesktopUIResolver` 或显式 `style` 导入（见 `vite.md`）
- [ ] 优先检索本技能文档，确认无合适能力后再自建或引入外部库
