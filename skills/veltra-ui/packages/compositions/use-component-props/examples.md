# useComponentProps 示例

## 合并公共 props 到子节点

```vue
<script setup lang="ts">
import { useComponentProps } from '@veltra/compositions'

const CommonProps = useComponentProps({ size: 'small', disabled: false })
</script>

<template>
  <CommonProps>
    <u-button type="primary">剪切</u-button>
    <u-button type="primary">复制</u-button>
    <!-- 子节点已写的 props 优先，不会被覆盖 -->
    <u-button type="primary" size="large">粘贴</u-button>
  </CommonProps>
</template>
```

## 包一层 HTML 标签

```vue
<script setup lang="ts">
import { useComponentProps } from '@veltra/compositions'

const CommonProps = useComponentProps({ size: 'small' })
</script>

<template>
  <CommonProps tag="div" class="toolbar">
    <u-button type="primary">操作</u-button>
  </CommonProps>
</template>
```
