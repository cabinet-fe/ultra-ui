# UTag — 标签

> `import type { TagProps } from '@veltra/desktop'`

标签组件，用于展示分类、属性、状态等。支持多颜色、深色模式、可移除、圆角。

## Import

```ts
import { UTag } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `type` | `ColorType` | — | 颜色类型 |
| `size` | `ComponentSize` | `'default'` | 尺寸 |
| `closable` | `boolean` | — | 可移除 |
| `round` | `boolean` | — | 圆角样式 |
| `dark` | `boolean` | — | 深色模式 |

## Emits

| event | 说明 |
|-------|------|
| `close` | 点击关闭图标触发 |

## Examples

### 基础类型 + 深色

```vue
<u-tag>默认</u-tag>
<u-tag type="primary">主要</u-tag>
<u-tag type="success">成功</u-tag>
<u-tag type="danger">危险</u-tag>

<!-- 深色模式 -->
<u-tag dark type="primary">深色</u-tag>
<u-tag dark type="success">深色</u-tag>
```

### 可移除标签

```vue
<script setup>
import { shallowRef } from 'vue'

const tags = shallowRef([
  { name: 'Vue', type: 'primary' as const },
  { name: 'React', type: 'info' as const },
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

### 圆角 + 组合使用

```vue
<u-tag round type="primary">圆角</u-tag>
<u-tag round closable dark type="primary" @close="() => {}">组合</u-tag>
<u-tag size="small" type="info">小</u-tag>
```
