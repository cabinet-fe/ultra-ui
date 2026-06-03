# UNodeRender 示例

## 基础使用

```vue
<script setup>
import { h } from 'vue'

const vnode = h('button', { type: 'primary' }, () => '保存')
</script>

<template>
  <u-node-render :content="vnode" />
  <!-- 渲染出一个 primary 按钮 -->
</template>
```

## VNode 自动合并 attrs

```vue
<script setup>
import { h } from 'vue'

const link = h('a', { class: 'my-link', target: '_blank' }, () => '前往')
</script>

<template>
  <u-node-render :content="link" style="color: red" data-track="nav" />
  <!-- VNode.props 会合并 style 和 data-track -->
</template>
```

## 渲染 VNode 数组

```vue
<script setup>
import { ref, h } from 'vue'

const tags = ref([
  h('span', { class: 'tag' }, () => 'Vue'),
  h('span', { class: 'tag', style: 'color: green' }, () => 'TypeScript'),
  h('span', { class: 'tag', style: 'color: orange' }, () => 'Bun')
])
</script>

<template>
  <u-node-render :content="tags" />
  <!-- 三个标签并排渲染 -->
</template>
```

## 回退到插槽

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
