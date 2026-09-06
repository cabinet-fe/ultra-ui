---
title: "useComponentProps - 插槽子节点公共属性自动合并"
description: "Vue 组合式函数，用于生成将公共 props（如 size、disabled、type）自动合并到底层默认插槽普通 VNode 子节点的 Wrapper 组件，保留子节点显式属性优先级，常用于表单项、按钮组与多组件上下文包裹注入"
keywords: ["useComponentProps", "@veltra/compositions", "use-component-props", "插槽子节点公共属性自动合并"]
aliases: ["use-component-props", "useComponentProps", "插槽子节点公共属性自动合并"]
---
## 快速上手

`useComponentProps` 返回一个 Vue 组件：把传入的公共属性合并到默认插槽里的普通 VNode。子节点上已经显式写出的同名属性优先，不会被覆盖。

从 `@veltra/compositions` 导入：

```ts
import { useComponentProps } from '@veltra/compositions'
```

参数是 `MaybeRef` 对象；传入 `ref` 时每次渲染按最新值合并。返回值当作普通组件使用，可选 `tag` 再包一层 HTML 元素。`tag` 存在时，调用方 `attrs` 里不属于公共属性的键落到该标签上。

```vue
<script setup lang="ts">
import { useComponentProps } from '@veltra/compositions'
import { UButton } from '@veltra/desktop'

const ActionButtons = useComponentProps({
  size: 'small',
  circle: true,
  text: true,
  type: 'primary'
})
</script>

<template>
  <ActionButtons tag="div" style="display: flex; gap: 8px">
    <UButton>新增</UButton>
    <UButton type="danger">删除</UButton>
  </ActionButtons>
</template>
```

上例中两个按钮都会得到 `size` / `circle` / `text`；第二个按钮自己写了 `type="danger"`，因此不会被公共的 `type: 'primary'` 覆盖。

