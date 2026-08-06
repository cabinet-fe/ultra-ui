# AGENTS.md — @veltra/desktop

桌面端 UI 组件库主包，70+ Vue 3 组件。

## 目录结构

```
src/
├── index.ts              # export * from './components' + types
├── install.ts            # UltraUI 全局注册（组件 + 指令 + 样式）
├── components/
│   ├── <name>/
│   │   ├── <name>.vue
│   │   ├── index.ts      # export U<PascalName>
│   │   ├── style.scss
│   │   ├── style.ts
│   │   ├── use-*.ts      # 可选
│   │   └── di.ts         # 可选 InjectionKey
│   └── index.ts
└── types/
    ├── index.ts
    └── <name>.ts         # Props / Emits / Exposed
```

## 组件模式

```vue
<script setup lang="ts">
import { bem } from '@veltra/utils'
import type { XxxProps } from '@veltra/desktop/types'

defineOptions({ name: 'Xxx' })
const props = defineProps<XxxProps>()
const cls = bem('xxx')
</script>
```

## 类型约定

类型在 `src/types/<name>.ts`，不在组件目录内：

- `<Name>Props`、`<Name>Emits`
- `_<Name>Exposed`（内部）、`<Name>Exposed`（`DeconstructValue` 导出）

## 新增组件

1. `components/<name>/`：`*.vue`、`index.ts`、`style.scss`、`style.ts`
2. `types/<name>.ts`，并在 `types/index.ts`、`components/index.ts` 导出
3. 在仓库根运行 `bun run resolver:gen` 刷新 `@veltra/vite` 组件表（否则 playground/宿主无法按需解析 `<u-xxx>`）
4. `playground/src/desktop/<name>/index.vue` 演示页（自动路由，需在 `nav-config.ts` 登记）

## 样式约定

组件 `style.scss` 通过 `@use 'pkg:@veltra/styles/functions' as fn` 引用 token，不写硬编码颜色/阴影（暗色完全由 token 切换，组件内不写 `[data-theme]` 分支）：

- 阴影分级：`fn.use-var(shadow, sm)` 贴面（卡片）、`fn.use-var(shadow)` 基础、`fn.use-var(shadow, lg)` 浮层（弹窗/下拉/通知）。
- 过渡：`fn.use-var(transition, fast|normal|slow)`（时长）+ `fn.use-var(transition, ease|ease-out)`（缓动）。
- 焦点指示：可交互元素统一 `:focus-visible { box-shadow: fn.use-var(focus-ring) }`；checkbox/radio/switch 用"原生 input 视觉隐藏但可聚焦 + 兄弟选择器 ring"模式（见 checkbox）。输入形态外壳用 JS 驱动的 `.is-focus`：`border-color: primary` + `box-shadow: fn.use-var(focus-ring)`（见 input/textarea）；不可聚焦的下拉壳（multi-select、multi-tree-select、cascade 多选、date-range-picker）改由下拉可见状态驱动 `.is-focus`（见 multi-select）。
- 透明度色：`fn.color-a(color, N, primary)` 等，N 取白名单 `4 5 8 10 11 16 22 28 35 40 50 52 60 70 86`。

## 依赖注入

table、nav、grid、tree、dialog 等复杂组件用 `di.ts` 定义 `InjectionKey`，父子 `provide` / `inject`。

## UContextmenu（右键菜单）

- 函数式 API：`contextmenu.pop({ mousePosition, menus, width? })`（从 `@veltra/desktop` 主入口导入）。
- `ContextmenuItem` 字段：
  - `label?` / `icon?` / `children?` / `callback?` / `disabled?`（原有）
  - `divider?: boolean` — 渲染分割线（忽略其余字段）
  - `render?: Component` — 自定义内容（替代 label；点击 `@click.stop`，不冒泡到关闭流程）
  - `keepOpen?: boolean` — 点击本项不关闭菜单（供内嵌交互组件）
- 内嵌组件可 `inject(ContextmenuRootDIKey)`（已从 `@veltra/desktop` 导出）调用
  `onItemClickEnd()` 主动关闭；确认/Esc 场景常用。
- 组件测试：`components/contextmenu/__test__/contextmenu.test.ts`。

## 导出子路径

| 子路径                    | 用途               |
| ------------------------- | ------------------ |
| `@veltra/desktop`         | 组件 + 类型        |
| `@veltra/desktop/install` | `UltraUI` 全局注册 |
| `@veltra/desktop/style`   | 全量样式           |
| `@veltra/desktop/*`       | 深度子路径         |

## 依赖

- **dependencies**：Lexical、EmbedPDF 等运行时库
- **peer**：`@cat-kit/core`、`@cat-kit/fe`（`>=1.1.8`）、`@veltra/utils`、`@veltra/styles`、`@veltra/compositions`、`@veltra/directives`、`@veltra/icons`、`vue`
- **`@veltra/sheet-core` 为 optional peer**：仅 `file-viewer` 的 Excel/CSV 预览需要；未安装时该预览优雅降级，不强制下游安装 sheet-core / VTable / hucre。预览器对 sheet-core 使用动态 `import()`，避免加载 desktop 主入口时解析失败。
- **`@codemirror/*` 打包进产物**（声明在 `devDependencies` + `pack.deps.alwaysBundle`），下游无需安装 codemirror，从根本上避免多实例版本冲突。仍需保持精确版本号（不带 `^`/`~`），升级时手动指定具体版本号。
- **UCodeEditor 语言包按需加载**：`components/code-editor/lang-loaders.ts` 注册各语言的 `import()` loader，切换 `lang`（`v-model:lang` / `langs`）时动态加载；`alwaysBundle` 确保 chunk 仍内联进 dist。
  - 官方语言包：① `devDependencies` + 根 `overrides` 添加 `@codemirror/lang-xxx`（精确版本）② `types/code-editor.ts` 扩展 `CodeEditorLang` ③ `lang-loaders.ts` 添加一条 loader。
  - legacy-modes（如 bash / powershell）：① `devDependencies` 添加 `@codemirror/legacy-modes`（精确版本）② `langs/<name>/` 用 `StreamLanguage.define` 包装对应 mode ③ `CodeEditorLang` + `lang-loaders.ts` 注册。
  - 自定义语言：放在 `components/code-editor/langs/<name>/`（如 SpEL 用 `StreamLanguage`），在 `CodeEditorLang` + `lang-loaders.ts` 注册即可，无需改 `package.json` / `overrides`。

## 验证

```bash
bun run lint
vp pack -F @veltra/desktop
cd playground && vp dev    # UI 与按需样式
bun run build                       # 全量拓扑
```
