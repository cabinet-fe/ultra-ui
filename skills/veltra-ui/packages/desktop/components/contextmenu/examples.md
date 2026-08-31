# UContextmenu 示例

## 基础 + 图标 + async 回调

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Edit, Copy, Delete } from '@veltra/icons/normal'
import type { ContextmenuItem } from '@veltra/desktop'

const visible = ref(false)
const pos = ref({ x: 0, y: 0 })

const menus: ContextmenuItem[] = [
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

  <u-contextmenu v-if="visible" :mouse-position="pos" :menus="menus" @destroy="visible = false" />
</template>
```

## 动态菜单（函数形式 + 禁用判定）

```ts
import type { ContextmenuItem } from '@veltra/desktop'

// 占位：替换为实际的权限判断逻辑
const hasPermission = () => true

function getMenus(): ContextmenuItem[] {
  return [
    { label: '新增', callback: () => console.log('新增') },
    { label: '编辑', disabled: () => !hasPermission(), callback: () => {} },
    { label: '删除', disabled: true }
  ]
}
```

## 自定义宽度 + 尺寸

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ContextmenuItem } from '@veltra/desktop'

const visible = ref(false)
const pos = ref({ x: 0, y: 0 })

const menus: ContextmenuItem[] = [
  { label: '菜单项一', callback: () => console.log('菜单项一') },
  { label: '菜单项二', callback: () => console.log('菜单项二') }
]
</script>

<template>
  <u-contextmenu
    v-if="visible"
    :mouse-position="pos"
    :menus="menus"
    :width="240"
    size="large"
    @destroy="visible = false"
  />
</template>
```

## 分割线 + 自定义渲染 + keepOpen

```ts
import { defineComponent, h, inject } from 'vue'
import { ContextmenuRootDIKey, type ContextmenuItem } from '@veltra/desktop'

const CountItem = defineComponent({
  setup() {
    const root = inject(ContextmenuRootDIKey)
    return () =>
      h('button', { type: 'button', onClick: () => root?.onItemClickEnd() }, '确认并关闭')
  }
})

const menus: ContextmenuItem[] = [
  { label: '普通项', callback: () => {} },
  { divider: true },
  { label: '内嵌交互', keepOpen: true, render: CountItem }
]
```
