# UContextmenu - 右键菜单

## 类型文件

见 `./types.d.ts`

## 示例

见 `./examples.md`

## ContextmenuItem 扩展字段

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `divider` | `boolean?` | 渲染分割线（忽略其余字段） |
| `render` | `Component?` | 自定义内容（替代 label；点击不冒泡关闭） |
| `keepOpen` | `boolean?` | 点击本项不关闭菜单（内嵌交互组件） |

内嵌组件可注入 `ContextmenuRootDIKey`（`@veltra/desktop` 导出）调用 `onItemClickEnd()` 主动关闭：

```ts
import { ContextmenuRootDIKey } from '@veltra/desktop'
import { inject } from 'vue'

const root = inject(ContextmenuRootDIKey)
root?.onItemClickEnd()
```

## 辅助工具

本组件通常配合以下工具来使用。

### contextmenu

在鼠标位置弹出右键菜单（函数式 API）。

使用示例:

```ts
import { contextmenu } from '@veltra/desktop'

contextmenu.pop({
  mousePosition: { x: 100, y: 100 },
  width: 240,
  menus: [
    { label: '复制', callback: () => {} },
    { divider: true },
    { label: '自定义', keepOpen: true, render: MyInteractiveItem }
  ]
})
```
