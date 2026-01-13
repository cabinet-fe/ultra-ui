# UI 模块级副作用（import 即执行）排查与整改

## 背景

`ui/` 包当前声明了 `"sideEffects": false`（见 `ui/package.json`），这通常意味着打包器可以假定“纯模块”，并在 tree-shaking 时安全裁剪未使用导出。

因此，**任何“导入即执行”的逻辑**（模块顶层启动 watcher、注册全局事件、直接触碰 `document/window`、启动定时器等）都应避免，至少需要：

- 改为“按需初始化 / 首次使用才启动”
- 支持“最后一次使用后释放”
- 或显式标注为有副作用（但这会影响 tree-shaking）

> 说明：本 issue 不讨论样式入口（如 `style.ts` / `styles` 目录内的样式导入）。

## 发现的问题（模块级副作用）

### 1) `v-click-outside`：导入即创建 watcher，并可能注册全局事件

- 文件：`ui/directives/click-outside/index.ts#L42`
- 现状：模块顶层 `watch(targets, ...)` 会在 import 时立即创建 watcher；当 `targets` 非空时会触发 `document.addEventListener(...)`。
- 风险：
  - SSR 环境下 `document` 不存在会直接报错
  - “导入即可常驻 watcher”，难以在没有使用该指令时释放资源
  - 与 `"sideEffects": false` 语义冲突（在打包/拆包边界上更难推断行为）

### 2) `use-config`：导入即创建 watcher，且直接操作 DOM

- 文件：`ui/compositions/use-config/index.ts#L41`
- 现状：模块顶层 `watch(() => state.size, setDocumentSize)` 导致 import 时立即创建 watcher；`setDocumentSize` 直接读写 `document.documentElement.classList`（见 `ui/compositions/use-config/index.ts#L33`）。
- 风险：
  - SSR 环境下 `document` 不存在会直接报错
  - “导入即可改变全局状态”的边界不清晰

## 其他可接受但需明确边界的副作用（非模块级）

以下更像“API 设计上的有意副作用”（调用时才触发），通常可接受，但建议在文档中明确“会触碰 DOM / 全局容器”：

- `ui/compositions/use-pop/index.ts`：首次调用时创建并挂载全局 `#pop-container`
- `ui/components/message/message.ts`：调用 `message(...)` 时创建 app 并 append 到 `document.body`
- `ui/components/notification/index.ts`：调用 `Notification(...)` 时创建 wrapper 并 append 到 `document.body`
- `ui/components/context-menu/api.ts`：调用 `contextmenu.pop(...)` 时 render 到 `document.body`

## 建议整改方案（可选其一）

### 方案 A（推荐）：按需初始化 + 引用计数释放

- 将模块顶层 watcher 改为“第一次 mounted/调用时初始化”
- 维护使用计数（或 active set），当计数归零时 stop watcher、移除全局事件
- SSR：所有 `document/window` 访问都需要 `typeof document !== 'undefined'` 保护

### 方案 B：显式声明副作用

- 如果确实需要 import 即生效，则需要重新评估 `ui/package.json` 的 `"sideEffects": false`，并将有副作用的文件加入 sideEffects 白名单（可能降低 tree-shaking 效果）

## 验收标准

- [ ] 导入 `@ui/directives/click-outside` 不会创建任何 watcher / 注册任何全局事件
- [ ] 导入 `@ui/compositions/use-config` 不会创建 watcher，也不会触碰 `document`
- [ ] 在 SSR（无 `document`）环境下导入 `ui/index.ts` / `ui/install.ts` / `ui/components/*` 不抛错（不含样式入口）
- [ ] 指令/组合式函数在最后一次释放后不再持有全局监听（无泄漏）

