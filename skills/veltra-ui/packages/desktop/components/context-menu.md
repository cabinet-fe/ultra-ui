# UContextMenu — 右键菜单

> `import type { ContextMenuProps, ContextMenuEmits, ContextMenuItem } from '@veltra/desktop'`

在指定鼠标位置弹出的上下文菜单。点击菜单外部或执行完菜单项回调后自动关闭并销毁，通过 `destroy` 事件通知父组件移除 DOM。

## Import

```ts
import { UContextMenu } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `mousePosition` | `{ x: number; y: number }` | — | 菜单弹出位置（相对于视口） |
| `menus` | `ContextMenuItem[] \| (() => ContextMenuItem[])` | — | 菜单项列表，支持函数动态生成 |
| `width` | `number \| string` | `150` | 菜单宽度（px，传入数值自动补单位） |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 菜单尺寸 |

### ContextMenuItem

| prop | type | 说明 |
|------|------|------|
| `label` | `string` | 菜单名称 |
| `description` | `string` | 可选，菜单描述 |
| `icon` | `Component` | 可选，菜单图标组件 |
| `callback` | `() => void \| Promise<void>` | 可选，点击菜单项时执行的回调。支持 async，回调完成前显示 loading 并阻止关闭 |
| `disabled` | `boolean \| (() => boolean)` | 可选，是否禁用。支持函数动态判断 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `destroy` | — | 菜单关闭动画完成后触发，父组件应在此事件中移除组件 DOM |

## Slots

无插槽。

## Exposed

无暴露属性。

## Examples

### 基础用法

监听 `contextmenu` 事件，在鼠标位置弹出菜单。

```vue
<template>
  <div
    style="height: 300px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center"
    @contextmenu.prevent="handleContextMenu"
  >
    右键点击此区域
  </div>

  <UContextMenu
    v-if="contextMenuVisible"
    :mouse-position="contextMenuPos"
    :menus="menus"
    @destroy="contextMenuVisible = false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UContextMenu } from '@veltra/desktop'
import type { ContextMenuItem } from '@veltra/desktop'

const contextMenuVisible = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })

const menus: ContextMenuItem[] = [
  { label: '复制', callback: () => console.log('复制') },
  { label: '粘贴', callback: () => console.log('粘贴') },
  { label: '删除', callback: () => console.log('删除') }
]

function handleContextMenu(e: MouseEvent) {
  contextMenuPos.value = { x: e.clientX, y: e.clientY }
  contextMenuVisible.value = true
}
</script>
```

### 动态菜单（函数形式）

```vue
<template>
  <div
    style="height: 300px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center"
    @contextmenu.prevent="handleContextMenu"
  >
    右键点击此区域
  </div>

  <UContextMenu
    v-if="contextMenuVisible"
    :mouse-position="contextMenuPos"
    :menus="getMenus"
    @destroy="contextMenuVisible = false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UContextMenu } from '@veltra/desktop'
import type { ContextMenuItem } from '@veltra/desktop'

const contextMenuVisible = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })

function getMenus(): ContextMenuItem[] {
  return [
    { label: '新增', callback: () => console.log('新增') },
    { label: '编辑', callback: () => console.log('编辑') },
    { label: '删除', disabled: true }
  ]
}

function handleContextMenu(e: MouseEvent) {
  contextMenuPos.value = { x: e.clientX, y: e.clientY }
  contextMenuVisible.value = true
}
</script>
```

### 带图标与 async 回调

```vue
<template>
  <div
    style="height: 300px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center"
    @contextmenu.prevent="handleContextMenu"
  >
    右键点击此区域
  </div>

  <UContextMenu
    v-if="contextMenuVisible"
    :mouse-position="contextMenuPos"
    :menus="menus"
    @destroy="contextMenuVisible = false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UContextMenu } from '@veltra/desktop'
import { Edit, Delete, Copy } from '@veltra/icons/normal'
import type { ContextMenuItem } from '@veltra/desktop'

const contextMenuVisible = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })

const menus: ContextMenuItem[] = [
  {
    label: '编辑',
    icon: Edit,
    callback: () => console.log('编辑')
  },
  {
    label: '复制',
    icon: Copy,
    callback: () => console.log('复制')
  },
  {
    label: '删除',
    icon: Delete,
    callback: async () => {
      // 异步删除操作，执行期间菜单显示 loading 并阻止关闭
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('已删除')
    }
  }
]

function handleContextMenu(e: MouseEvent) {
  contextMenuPos.value = { x: e.clientX, y: e.clientY }
  contextMenuVisible.value = true
}
</script>
```

### 自定义宽度与尺寸

```vue
<template>
  <div
    style="height: 300px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center"
    @contextmenu.prevent="handleContextMenu"
  >
    右键点击此区域
  </div>

  <UContextMenu
    v-if="contextMenuVisible"
    :mouse-position="contextMenuPos"
    :menus="menus"
    :width="240"
    size="large"
    @destroy="contextMenuVisible = false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UContextMenu } from '@veltra/desktop'
import type { ContextMenuItem } from '@veltra/desktop'

const contextMenuVisible = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })

const menus: ContextMenuItem[] = [
  { label: '查看详情', callback: () => console.log('查看详情') },
  { label: '编辑属性', callback: () => console.log('编辑属性') },
  { label: '复制路径', callback: () => console.log('复制路径') },
  { label: '删除', disabled: true, callback: () => console.log('删除') }
]

function handleContextMenu(e: MouseEvent) {
  contextMenuPos.value = { x: e.clientX, y: e.clientY }
  contextMenuVisible.value = true
}
</script>
```
