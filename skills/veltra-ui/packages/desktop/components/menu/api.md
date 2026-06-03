# UMenu — 菜单

> `import type { MenuProps, MenuEmits, MenuExposed, MenuItem } from '@veltra/desktop'`

> 类型：`../../../generated/types/menu.ts`

侧边导航菜单：多级嵌套、图标、折叠/展开、当前路径高亮。`UMenuItem` / `UMenuSub` 是内部递归组件，由 `UMenu` 自动渲染，仅在自定义布局时直接使用。

## Import

```ts
// UMenu / UMenuItem / UMenuSub 由 Vite 自动导入，无需手动 import
import type { MenuItem } from '@veltra/desktop'
```

## 关联类型

```ts
interface MenuItem {
  title: string // 菜单标题
  path: string // 路径，匹配 currentPath 高亮
  icon?: string | DefineComponent // 图片 URL 或图标组件
  disabled?: boolean
  children?: MenuItem[] // 子菜单
  [key: string]: any // 透传字段
}
```

> 示例见 [examples.md](./examples.md)
