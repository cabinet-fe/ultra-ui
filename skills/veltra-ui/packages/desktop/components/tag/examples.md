# UTag 示例

## 基础颜色与深色

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

## 圆角与尺寸

```vue
<u-tag round type="primary">圆角标签</u-tag>
<u-tag size="small" type="info">小尺寸</u-tag>
<u-tag size="large" round type="success">大尺寸圆角</u-tag>
```

## 可移除标签

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

## 组合使用

```vue
<u-tag round closable dark type="danger" @close="handleClose">可移除深色圆角</u-tag>
<u-tag round closable type="primary" size="large" @close="handleClose">大号可移除圆角</u-tag>
```
