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
3. `playground/src/<name>/index.vue` 演示页（自动路由，需在 `nav-config.ts` 登记）

## 依赖注入

table、nav、grid、tree、dialog 等复杂组件用 `di.ts` 定义 `InjectionKey`，父子 `provide` / `inject`。

## 导出子路径

| 子路径                    | 用途               |
| ------------------------- | ------------------ |
| `@veltra/desktop`         | 组件 + 类型        |
| `@veltra/desktop/install` | `UltraUI` 全局注册 |
| `@veltra/desktop/style`   | 全量样式           |
| `@veltra/desktop/*`       | 深度子路径         |

## 依赖

- **dependencies**：Lexical、EmbedPDF、VTable 等运行时库
- **peer**：`@cat-kit/core`、`@cat-kit/excel`、`@veltra/utils`、`@veltra/styles`、`@veltra/compositions`、`@veltra/directives`、`@veltra/icons`、`vue`
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
