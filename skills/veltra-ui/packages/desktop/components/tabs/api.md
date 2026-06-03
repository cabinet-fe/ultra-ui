# UTabs / UTabsHorizontal / UTabsVertical — 标签页

> `import type { TabsProps, TabsEmits, TabsExposed, TabItem } from '@veltra/desktop'`

> 类型：`../../../generated/types/tabs.ts`

`UTabs` 为组合版（tab 栏 + 内容面板）。`UTabsHorizontal` / `UTabsVertical` 为仅有 tab 栏的独立组件，适合自管内容（如后台路由栏）。

## Import

```ts
// UTabs / UTabsHorizontal / UTabsVertical 由 Vite 自动导入，无需手动 import
import type { TabItem } from '@veltra/desktop'
```

## 关联类型

```ts
interface TabItem {
  key: string // 唯一标识，同时是内容面板 slot 名
  name?: string // 标题，不传则用 key
  disabled?: boolean
  closable?: boolean // 单项级覆盖，未设置时沿用组件级 closable
}
```

> 示例见 [examples.md](./examples.md)
