# UTag — 标签

> `import type { TagProps, TagEmits, TagExposed } from '@veltra/desktop'`

标签组件，用于展示分类、属性、状态等。支持多颜色、深色模式、可移除、圆角。`size` 优先跟随表单上下文 `FormContext`，未提供时回退为 `'default'`。

## Import

```ts
// UTag 由 Vite 自动导入，无需手动 import
```

## Props

| prop       | 类型            | 默认值      | 说明       |
| ---------- | --------------- | ----------- | ---------- |
| `type`     | `ColorType`     | —           | 颜色类型   |
| `closable` | `boolean`       | —           | 是否可移除 |
| `size`     | `ComponentSize` | `'default'` | 尺寸大小   |
| `round`    | `boolean`       | —           | 是否为圆角 |
| `dark`     | `boolean`       | —           | 深色       |

## Emits

| event   | 签名         | 说明               |
| ------- | ------------ | ------------------ |
| `close` | `() => void` | 点击关闭图标时触发 |

## Slots

| slot      | 说明     |
| --------- | -------- |
| `default` | 标签内容 |

## Exposed

```ts
interface TagExposed {}
```

## Examples

### 基础颜色与深色

```vue
<u-tag>默认</u-tag>
<u-tag type="primary">主要</u-tag>
<u-tag type="success">成功</u-tag>
<u-tag type="warning">警告</u-tag>
<u-tag type="danger">危险</u-tag>
<u-tag type="info">信息</u-tag>

<!-- 深色变体 -->
<u-tag dark type="primary">深色主要</u-tag>
<u-tag dark type="danger">深色危险</u-tag>
```

### 圆角与尺寸

```vue
<u-tag round type="primary">圆角标签</u-tag>
<u-tag size="small" type="info">小尺寸</u-tag>
<u-tag size="large" round type="success">大尺寸圆角</u-tag>
```

### 可移除标签

```vue
<script setup>
import { shallowRef } from 'vue'

const tags = shallowRef([
  { name: 'Vue', type: 'primary' },
  { name: 'React', type: 'info' },
  { name: 'Angular', type: 'warning' },
])

const removeTag = (index: number) => {
  tags.value = tags.value.filter((_, i) => i !== index)
}
</script>

<template>
  <u-tag
    v-for="(tag, index) in tags"
    :key="index"
    :type="tag.type"
    closable
    @close="removeTag(index)"
  >
    {{ tag.name }}
  </u-tag>
</template>
```

### 组合使用

```vue
<u-tag round closable dark type="danger" @close="handleClose">可移除深色圆角</u-tag>
<u-tag round closable type="primary" size="large" @close="handleClose">大号可移除圆角</u-tag>
```
