# UContextMenu — 右键菜单

> `import type { ContextMenuProps, ContextMenuEmits, ContextMenuItem } from '@veltra/desktop'`

在指定鼠标位置弹出的上下文菜单。点击外部或菜单项回调完成后自动关闭，通过 `destroy` 事件通知父组件移除 DOM。

## Import

```ts
// UContextMenu 由 Vite 自动导入，无需手动 import
```

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

## Props

| prop            | type                                             | default     | 说明                           |
| --------------- | ------------------------------------------------ | ----------- | ------------------------------ |
| `mousePosition` | `{ x: number; y: number }`                       | —           | 弹出位置（相对视口）           |
| `menus`         | `ContextMenuItem[] \| (() => ContextMenuItem[])` | —           | 菜单项列表（函数形式动态生成） |
| `width`         | `number \| string`                               | `150`       | 菜单宽度（数值自动补 px）      |
| `size`          | `'small' \| 'default' \| 'large'`                | `'default'` | 尺寸                           |

## Emits

| event     | 参数 | 说明                                         |
| --------- | ---- | -------------------------------------------- |
| `destroy` | —    | 关闭动画完成，父组件应在此事件中移除组件 DOM |

## Slots / Exposed

无。

## Examples

### 基础 + 图标 + async 回调

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Edit, Copy, Delete } from '@veltra/icons/normal'
import type { ContextMenuItem } from '@veltra/desktop'

const visible = ref(false)
const pos = ref({ x: 0, y: 0 })

const menus: ContextMenuItem[] = [
  { label: '编辑', icon: Edit, callback: () => console.log('编辑') },
  { label: '复制', icon: Copy, callback: () => console.log('复制') },
  {
    label: '删除',
    icon: Delete,
    callback: async () => {
      // 异步执行期间显示 loading，阻止菜单关闭
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
]

function onContextMenu(e: MouseEvent) {
  pos.value = { x: e.clientX, y: e.clientY }
  visible.value = true
}
</script>

<template>
  <div style="height: 300px; border: 1px dashed #ccc" @contextmenu.prevent="onContextMenu">
    右键点击此区域
  </div>

  <u-context-menu v-if="visible" :mouse-position="pos" :menus="menus" @destroy="visible = false" />
</template>
```

### 动态菜单（函数形式 + 禁用判定）

```ts
function getMenus(): ContextMenuItem[] {
  return [
    { label: '新增', callback: () => console.log('新增') },
    { label: '编辑', disabled: () => !hasPermission(), callback: () => {} },
    { label: '删除', disabled: true }
  ]
}
```

### 自定义宽度 + 尺寸

```vue
<u-context-menu
  v-if="visible"
  :mouse-position="pos"
  :menus="menus"
  :width="240"
  size="large"
  @destroy="visible = false"
/>
```
