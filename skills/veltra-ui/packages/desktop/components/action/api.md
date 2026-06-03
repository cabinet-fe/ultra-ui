# UAction / UActionGroup — 操作按钮

> `import type { ActionProps, ActionEmits, ActionExposed, ActionGroupProps, ActionGroupExposed } from '@veltra/desktop'`

> 类型：`../../../generated/types/action.ts`

`UAction` 继承 `UButton` 所有能力，额外提供 `needConfirm` 二次确认和 `run` 事件。`UActionGroup` 包裹多个操作，超出 `max` 的项自动收纳到 `…` 下拉菜单，支持统一控制子项默认样式（`type`/`size`/`text`/`circle`/`loading`）。

## Import

```ts
// UAction、UActionGroup 由 Vite 自动导入，无需手动 import
```

> 示例见 [examples.md](./examples.md)
