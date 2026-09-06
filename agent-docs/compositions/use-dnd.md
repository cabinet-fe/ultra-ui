---
title: useDnD 列表拖拽排序
description: 基于 FormKit drag-and-drop 的 Vue 封装，排序与跨容器转移自动写回数据
---

`useDnD` 把列表排序 / 跨容器转移的结果自动写回数据源，不必在 `onSort` 里手动 `splice`。组件卸载时自动销毁拖拽实例。从 `@formkit/drag-and-drop` 原样重导出的符号也从本包导入，不要再单独安装 `@formkit/drag-and-drop`。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { animations, useDnD } from '@veltra/compositions'

const list = ref([
  { id: 1, label: 'A' },
  { id: 2, label: 'B' }
])

const { parentRef, values } = useDnD({
  values: list,
  plugins: [animations()]
})
</script>

<template>
  <ul ref="parentRef">
    <li v-for="item in values" :key="item.id">{{ item.label }}</li>
  </ul>
</template>
```

`values` 写回规则：

| 传入 | 写回 |
| --- | --- |
| `Ref` | 替换 `.value` |
| 响应式数组 | 原地 `splice` |
| 普通数组 | 内部副本驱动视图，并同步原数组 |
| getter / 只读 computed | 经 `onReorder` 给出合并后的完整数组 |
| 不传 | 用返回的 `values` 读写 |

`filter` 只让命中项参与拖拽（须与 DOM 中可拖项一一对应）；未命中项保持相对顺序，结果自动合并回原数组。`parent` 可传 ref / getter，元素出现、替换、移除时重建实例；不传则把返回的 `parentRef` 绑到列表容器。

```ts
import { animations, useDnD } from '@veltra/compositions'

useDnD({
  values: props.items,
  filter: (item) => item.visible,
  parent: () => addBtnRef.value?.parentElement ?? undefined,
  dragHandle: '.handle',
  draggable: (el) => el.classList.contains('item'),
  group: 'tasks',
  plugins: [animations()],
  onReorder(next) {
    emit('update:items', next)
  }
})
```

返回值：`parentRef`、`values`（`filter` 模式下是参与拖拽的视图）、`updateConfig`（整体替换配置，不含 `values` / `filter` / `parent` / `onReorder`）。多容器互拖时各实例设相同 `group`。

类型 `UseDnDOptions`、`UseDnDResult`、`VueParentConfig` 从 `@veltra/compositions` 导入。FormKit 侧常用值同样从本包导入，例如 `animations`、`dragAndDrop`、`useDragAndDrop`、`dropOrSwap`、`insert`、`tearDown`、`performSort`、`performTransfer`。
