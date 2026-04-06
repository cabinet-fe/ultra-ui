# 从 ultra-ui 0.4.x 迁移到 @ultra-ui/\* 1.0.0

本文说明 0.4.x 单包 `ultra-ui` 与 monorepo 子包 1.0.0 之间的 breaking changes。

## 包名变更

| 旧包名    | 新包名 |
| --------- | ------ |
| ultra-ui（单包） | `@ultra-ui/pc`（组件与安装入口） |
| （无）    | `@ultra-ui/core`（工具、组合式、共享类型） |
| （无）    | `@ultra-ui/styles`（全局样式与主题） |
| （无）    | `@ultra-ui/directives`（指令） |

应用侧通常至少安装：`@ultra-ui/pc`、`@ultra-ui/core`、`@ultra-ui/styles`；若直接使用指令再安装 `@ultra-ui/directives`。

## 导入路径变更

```typescript
// 旧
import { UButton } from 'ultra-ui'
import 'ultra-ui/styles'

// 新
import { UButton } from '@ultra-ui/pc'
import '@ultra-ui/styles'
```

按需注册或全量安装仍从 `@ultra-ui/pc` 的 `install` 导出使用。

## 依赖变更

**移除（0.4.x 常见）**

- `ultra-ui`
- `cat-kit`（非 scoped）
- `@ultra/icon`

**新增**

- `@ultra-ui/pc`
- `@ultra-ui/core`
- `@ultra-ui/styles`
- `@ultra-ui/directives`（若使用 `vRipple` / `vClickOutside` / `vFocus` 等）

内部实现已迁移到 `@cat-kit/core`、`@cat-kit/be` 等；应用一般只需声明上述 `@ultra-ui/*` 包。

## 图标：@ultra/icon → lucide-vue-next

组件库内图标已改为 `lucide-vue-next`。若你的代码曾从 `@ultra/icon` 按名引用，请按下表替换**组件名**与导入包名（`'@ultra/icon'` → `'lucide-vue-next'`）。

| @ultra/icon     | lucide-vue-next      |
| --------------- | -------------------- |
| ArrowDown       | ArrowDown            |
| ArrowUp         | ArrowUp              |
| ArrowLeft       | ArrowLeft            |
| ArrowRight      | ArrowRight           |
| DArrowLeft      | ChevronsLeft         |
| DArrowRight     | ChevronsRight        |
| Close           | X                    |
| Search          | Search               |
| Plus            | Plus                 |
| Minus           | Minus                |
| Check           | Check                |
| Loading         | LoaderCircle         |
| View            | Eye                  |
| Hide            | EyeOff               |
| Calendar        | Calendar             |
| Copy            | Copy                 |
| Edit            | Pencil               |
| Delete          | Trash2               |
| Move            | Move                 |
| Empty           | PackageOpen          |
| QuestionFilled  | CircleHelp           |
| Maximum         | Maximize             |
| Recover         | Minimize             |
| AddChild        | CopyPlus             |
| InsertToPrev    | BetweenVerticalStart |
| InsertToNext    | BetweenVerticalEnd   |

## TypeScript 路径别名

若曾使用 `@ui/*` 指向仓库内源码，请改为 `@ultra-ui/core` / `@ultra-ui/pc` 等公共包导入，或在本仓库内使用相对路径（见 `AGENTS.md`）。

## 构建与样式

- 主题与 SCSS 基础设施在 `@ultra-ui/styles`；确保构建链（Vite / sass）对 SCSS 配置 `loadPaths` 包含包的样式入口所需路径，或仅通过已编译 CSS 消费。
- 1.0 构建产物在各包 `dist/`，发版时 `workspace:*` 会同步为 semver 范围；安装时勿依赖未发布的 `workspace:` 协议。

## 更多

仓库内开发与约定以根目录 `AGENTS.md` 为准。
