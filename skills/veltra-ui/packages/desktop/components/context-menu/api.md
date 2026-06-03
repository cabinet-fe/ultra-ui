# UContextMenu — 右键菜单

> `import type { ContextMenuProps, ContextMenuEmits, ContextMenuItem } from '@veltra/desktop'`

> 类型：`../../../generated/types/context-menu.ts`

在指定鼠标位置弹出的上下文菜单。点击外部或菜单项回调完成后自动关闭，通过 `destroy` 事件通知父组件移除 DOM。

## Import

```ts
// UContextMenu 由 Vite 自动导入，无需手动 import
```

## contextmenu 函数式 API

```ts
import { contextmenu } from '@veltra/desktop'

contextmenu.pop({
  mousePosition: { x: event.clientX, y: event.clientY },
  menus: [
    { label: '复制', callback: () => {} },
    { label: '删除', callback: async () => {} }
  ]
})
```

- `contextmenu.pop(options: ContextMenuProps)` — 在鼠标位置弹出菜单，点击外部或回调完成后自动关闭并销毁 DOM

## 关联类型

```ts
interface ContextMenuItem {
  label: string // 菜单名称
  description?: string // 描述
  icon?: Component // 图标组件
  callback?: () => void | Promise<void> // 点击回调（async 期间显示 loading 并阻止关闭）
  disabled?: boolean | (() => boolean) // 禁用，支持函数动态判断
}
```

> 示例见 [examples.md](./examples.md)
