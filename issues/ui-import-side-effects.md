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
