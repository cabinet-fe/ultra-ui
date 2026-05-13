# UNodeRender — 节点渲染

> `import type { NodeRenderProps } from '@veltra/desktop'`

将 VNode、VNode 数组或原始值渲染到 DOM。当传入 VNode 时会自动将 attrs 合并到 VNode 的 props 上。CSS 类为 `.u-node-render`。

## Import

```ts
import { UNodeRender } from '@veltra/desktop'
// 按需
import { UNodeRender } from '@veltra/desktop/node-render'
// 类型
import type { NodeRenderProps } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `content` | `null \| undefined \| VNode \| VNode[] \| string \| number \| boolean` | — | 要渲染的内容。`undefined` 时回退到 `default` 插槽；VNode 时会合并 attrs；数组直接渲染 |

## Emits

无。

## Slots

| name | 说明 |
|------|------|
| `default` | 当 `content` 为 `undefined` 时作为回退内容渲染 |

## Exposed

| 成员 | 类型 | 说明 |
|------|------|------|
| — | — | 当前无暴露成员 |

## Examples

### 基础使用

```vue
<script setup>
import { h } from 'vue'
import { UButton } from '@veltra/desktop'

const vnode = h(UButton, { type: 'primary' }, () => '保存')
</script>

<template>
  <u-node-render :content="vnode" />
  <!-- 渲染出一个 primary 按钮 -->
</template>
```

### VNode 自动合并 attrs

```vue
<script setup>
import { h } from 'vue'

const link = h('a', { class: 'my-link', target: '_blank' }, () => '前往')
</script>

<template>
  <u-node-render
    :content="link"
    style="color: red"
    data-track="nav"
  />
  <!-- VNode.props 会合并 style 和 data-track -->
</template>
```

### 渲染 VNode 数组

```vue
<script setup>
import { ref, h } from 'vue'
import { UTag } from '@veltra/desktop'

const tags = ref([
  h(UTag, () => 'Vue'),
  h(UTag, { type: 'success' }, () => 'TypeScript'),
  h(UTag, { type: 'warning' }, () => 'Bun')
])
</script>

<template>
  <u-node-render :content="tags" />
  <!-- 三个 Tag 并排渲染 -->
</template>
```

### 回退到插槽

```vue
<script setup>
import { ref } from 'vue'

const customVNode = ref(undefined)
</script>

<template>
  <u-node-render :content="customVNode">
    <span class="fallback">暂无内容</span>
  </u-node-render>
  <!-- content=undefined → 渲染插槽中的 fallback 文本 -->
</template>
```
