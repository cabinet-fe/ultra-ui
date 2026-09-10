---
title: useComponentProps 插槽公共属性注入
description: 从 @veltra/compositions 导出的组合式函数，返回一个把公共属性（size、disabled、type 等）批量注入默认插槽子节点的 Wrapper 组件：子节点显式属性优先、非 Fragment/Template 的文本与元素/组件 VNode 一并处理，可选 tag 包一层 HTML 元素。
aliases: [use-component-props, ComponentCommonProps, 公共属性包装组件, props 批量注入]
keywords: [useComponentProps, ComponentCommonProps, MaybeRef, inheritAttrs, cloneVNode, extractNormalVNodes, tag, attrs, 公共属性注入, 批量设置属性, 插槽透传, 按钮组统一尺寸, 属性合并, 子节点优先]
---

# useComponentProps 插槽公共属性注入

`@veltra/compositions` 导出的 `useComponentProps(props)` 返回一个 Vue 组件（组件名 `ComponentCommonProps`）：把公共属性合并进默认插槽里的每个子 VNode，子节点上已显式声明的同名属性不被覆盖。用于按钮组统一 `size` / `type`、给一组表单控件批量注入 `disabled` 等场景。

## 快速上手

从 `@veltra/compositions` 导入 `useComponentProps`，传入公共属性对象，把返回值当普通组件使用：

```vue
<script setup lang="ts">
import { useComponentProps } from '@veltra/compositions'
import { UButton } from '@veltra/desktop'

// 公共属性对象：出现在这里的 key 才会被注入子节点
const ActionButtons = useComponentProps({
  size: 'small',
  text: true,
  type: 'primary'
})
</script>

<template>
  <ActionButtons>
    <UButton>新增</UButton>
    <!-- 子节点自己写了 type="danger"，公共的 type: 'primary' 不覆盖它 -->
    <UButton type="danger">删除</UButton>
  </ActionButtons>
</template>
```

`props` 参数接受普通对象或 `ref`；传入 `ref` 时每次渲染读取 `props.value`，公共属性可响应式变化。

## API 签名

```ts
import type { Component, MaybeRef } from 'vue'

/**
 * 生成一个把公共属性注入默认插槽子节点的组件
 * @param props 公共属性对象，支持 ref 包裹实现响应式
 * @returns 一个 Vue 组件，内部组件名为 'ComponentCommonProps'，inheritAttrs 为 false
 */
export function useComponentProps<T extends Record<string, any>>(
  props: MaybeRef<T & Record<string, any>>
): Component

/** 返回的组件自身只声明了一个 prop，其余属性进入 attrs */
interface ComponentCommonPropsProps {
  /** 渲染一个标准 html5 标签，把注入后的子节点包进该标签。不传时只渲染子节点本身 */
  tag?: string
}
```

类型参数 `T` 用于约束公共属性对象并保留类型提示，可直接传目标组件的 Props 类型：`useComponentProps<ButtonProps>({ circle: true })`。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `props` | `MaybeRef<T & Record<string, any>>` | — | 是 | 普通对象时 key 集合在 setup 时固定并缓存；`Ref` 对象时每次渲染重新取 `Object.keys(props.value)`。只有对象里存在的 key 会被注入 |
| `tag`（返回组件的 prop） | `string` | — | 否 | 标签名如 `'div'`、`'span'`；未传时返回组件渲染的是子 VNode 数组（片段），传了才生成真实包裹元素 |

### 合并规则

`useComponentProps` 对默认插槽每个子 VNode 按以下顺序决定属性值，规则互斥、先命中先得：

1. 子 VNode 自身 `props[key] !== undefined`：保持子节点原值，跳过注入。
2. 包裹组件的 `attrs[key] !== undefined`：使用 `attrs` 值。由于返回组件只声明了 `tag` 一个 prop，写在 `<ActionButtons size="large">` 上的 `size` 会进 `attrs` 并覆盖公共对象里的 `size`。
3. 其余情况：使用公共属性对象 `props` 中的值。

作用范围约束：

- 仅处理**默认插槽**；具名插槽与作用域插槽的子节点不注入。
- 子节点集合先用 `extractNormalVNodes`（来自 `@veltra/utils`）拍平：`template` 与 `Fragment` 递归展开，字符串 / 数字文本转成文本 VNode；元素与组件 VNode 一律参与合并。
- 全部子节点都不需要注入新属性时（`count === 0`）原 VNode 原样返回，不执行 `cloneVNode`。
- 指定了 `tag` 且插槽无有效子节点时渲染 `undefined`（不输出任何 DOM）。
- `tag` 存在时，`attrs` 中不属于公共属性 key 的属性（如 `style`、`class`、`id`）落到 `tag` 生成的元素上，不会再传给子节点。

## 方法与事件

返回值是一个组件，没有暴露方法或事件。运行时行为要点：

- 同步渲染：合并发生在返回组件的 render 阶段，无定时器、无事件监听，无需清理。
- `props` 为 `ref` 时，修改 `props.value` 触发返回组件重渲染并按新值注入；普通对象时后续修改对象内容不一定触发重渲染，需要响应式请传 `ref`。

## 典型示例

### 按钮组统一属性

操作列里多个按钮共用 `size` / `circle` / `text` / `type`，个别按钮覆盖个别属性（`UTableEditor` 内部的真实用法）：

```vue
<script setup lang="ts">
import { useComponentProps } from '@veltra/compositions'
import { UButton } from '@veltra/desktop'

const ButtonCommonProps = useComponentProps({
  size: 'small',
  circle: true,
  text: true,
  type: 'primary'
})
</script>

<template>
  <ButtonCommonProps tag="div" style="display: flex; gap: 8px">
    <UButton>编辑</UButton>
    <UButton type="danger">删除</UButton>
  </ButtonCommonProps>
</template>
```

两个按钮都得到 `size="small"`、`circle`、`text`；`style` 不是公共属性 key，落到 `tag="div"` 生成的包裹元素上；删除按钮的 `type="danger"` 优先于公共 `type: 'primary'`。

### 按目标组件 Props 类型约束公共属性

用类型参数把公共属性对象的类型对齐到 `UButton` 的 Props，写错属性名时编译报错：

```vue
<script setup lang="ts">
import { useComponentProps } from '@veltra/compositions'
import type { ButtonProps } from '@veltra/desktop'
import { Lock, MoreFilled, Star } from '@veltra/icons/normal'
import { shallowRef } from 'vue'

const ButtonCommonProps = useComponentProps<ButtonProps>({
  circle: true,
  iconSize: 18,
  loading: false
})

const buttons = [
  { type: 'primary' as const, icon: Star },
  { type: 'warning' as const, icon: Lock },
  { icon: MoreFilled }
]

const loading = shallowRef(false)
</script>

<template>
  <ButtonCommonProps :loading="loading">
    <UButton v-for="(b, i) in buttons" :key="i" :type="b.type">
      <component :is="b.icon" />
    </UButton>
  </ButtonCommonProps>
</template>
```

`loading` 传入的是 `ref`，点击任一处把 `loading.value` 置 `true` 后全部按钮进入加载态；单个按钮自己绑定 `:loading` 则不受影响。

### 响应式批量禁用

公共属性对象用 `computed` 包成 `ref`，运行时切换整组控件的 `disabled`：

```vue
<script setup lang="ts">
import { useComponentProps } from '@veltra/compositions'
import { UInput } from '@veltra/desktop'
import { computed, ref } from 'vue'

const submitting = ref(false)
const name = ref('')
const phone = ref('')

const FieldCommonProps = useComponentProps(
  computed(() => ({
    disabled: submitting.value,
    size: 'small' as const
  }))
)
</script>

<template>
  <FieldCommonProps>
    <UInput v-model="name" placeholder="姓名" />
    <UInput v-model="phone" placeholder="手机号" />
  </FieldCommonProps>
</template>
```

`submitting` 为 `true` 时两个输入框同时禁用；子节点未显式写 `disabled`，因此全部命中注入。

## 注意事项

> [!WARNING]
> - 注入目标是**默认插槽**；写在 `<template #header>` 等具名插槽里的节点不会被注入。
> - 属性 key 集合由公共属性对象决定：写在包裹组件标签上、但不在公共对象里的属性（`tag` 场景下）落到 `tag` 元素，不会传给子节点。
> - 本库是「返回组件、把合并逻辑放在渲染期」，不是 VueUse `useTemplateRefsList` 那类 DOM 操作，也不是 `provide/inject`；子组件收到的就是普通 props，可在子组件内正常声明默认值。
> - 包裹组件 `inheritAttrs: false`，`class` / `style` 不会自动落到子节点：`tag` 场景落到 `tag` 元素，无 `tag` 时丢弃。
> - 公共属性对象里 value 为 `undefined` 的 key：子节点、`attrs` 也为 `undefined` 时最终注入 `undefined`，等同于没写该属性。

## 常见问题

### 子节点上的属性被意外覆盖

先检查同名属性是否写在了包裹组件标签上：`attrs` 优先级高于公共属性对象。子节点显式声明的属性优先级最高；去掉包裹标签上的同名属性即可恢复公共值。
