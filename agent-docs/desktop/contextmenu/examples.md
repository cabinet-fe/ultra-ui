---
title: UContextmenu 右键菜单示例
description: 组件用法传入 mousePosition 与 menus；函数式 API 用 contextmenu.pop
---

`UContextmenu` 需要 `mousePosition: { x, y }` 和 `menus`。菜单项可含 `label`、`icon`、`children`、`callback`、`disabled`、`divider`、`render`、`keepOpen`。关闭时触发 `destroy`。函数式入口是 `contextmenu.pop`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { contextmenu, type ContextmenuItem } from '@veltra/desktop'

const visible = shallowRef(false)
const pos = shallowRef({ x: 0, y: 0 })

const menus: ContextmenuItem[] = [
  { label: '复制', callback: () => {} },
  { divider: true },
  { label: '删除', disabled: true }
]

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  pos.value = { x: e.clientX, y: e.clientY }
  visible.value = true
}

function onPop(e: MouseEvent) {
  e.preventDefault()
  contextmenu.pop({
    mousePosition: { x: e.clientX, y: e.clientY },
    menus: [
      { label: '打开', callback: () => {} },
      { label: '重命名', callback: () => {} }
    ]
  })
}
</script>

<template>
  <div @contextmenu="onContextMenu">组件用法：在此右键</div>
  <u-contextmenu v-if="visible" :mouse-position="pos" :menus="menus" @destroy="visible = false" />

  <div @contextmenu="onPop">函数式：在此右键调用 contextmenu.pop</div>
</template>
```
