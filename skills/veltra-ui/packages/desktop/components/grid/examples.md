# UGrid 示例

## 固定列数

```vue
<u-grid :cols="24" :gap="16">
  <u-grid-item :span="12"><div style="background: var(--u-color-primary-light); padding: 16px">span 12</div></u-grid-item>
  <u-grid-item :span="12"><div style="background: var(--u-color-primary-light); padding: 16px">span 12</div></u-grid-item>
  <u-grid-item :span="8"><div style="background: var(--u-color-primary-light); padding: 16px">span 8</div></u-grid-item>
  <u-grid-item :span="8"><div style="background: var(--u-color-primary-light); padding: 16px">span 8</div></u-grid-item>
  <u-grid-item :span="8"><div style="background: var(--u-color-primary-light); padding: 16px">span 8</div></u-grid-item>
</u-grid>
```

## 响应式断点列数 + 响应式跨距

```vue
<u-grid :cols="{ xs: 4, sm: 8, md: 12, lg: 24 }" :gap="12">
  <u-grid-item :span="{ xs: 4, sm: 6, md: 8, lg: 6, default: 24 }">
    <div style="background: var(--u-color-primary-light); padding: 12px">响应式跨距</div>
  </u-grid-item>
  <u-grid-item :span="{ xs: 2, sm: 4, md: 6, lg: 6, default: 12 }">
    <div style="background: var(--u-color-primary-light); padding: 12px">另一列</div>
  </u-grid-item>
</u-grid>
```

## 函数动态列数 + 满行跨距

```vue
<u-grid :cols="(bp) => (bp.level < 3 ? 12 : 24)" :gap="16">
  <u-grid-item span="full">
    <div style="background: var(--u-color-primary-light); padding: 16px">整行标题</div>
  </u-grid-item>
  <u-grid-item :span="8"><div style="background: var(--u-color-primary-light); padding: 16px">A</div></u-grid-item>
  <u-grid-item :span="8"><div style="background: var(--u-color-primary-light); padding: 16px">B</div></u-grid-item>
  <u-grid-item :span="8"><div style="background: var(--u-color-primary-light); padding: 16px">C</div></u-grid-item>
</u-grid>
```

## 监听断点变化

```vue
<template>
  <u-grid :cols="{ xs: 6, md: 12, lg: 24 }" @breakpoint-change="onBreakpointChange">
    <u-grid-item :span="{ xs: 6, md: 6, default: 12 }">
      <div style="background: var(--u-color-primary-light); padding: 12px">
        当前断点: {{ bp?.name }}({{ bp?.level }})
      </div>
    </u-grid-item>
  </u-grid>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Breakpoint } from '@veltra/desktop'

const bp = ref<Breakpoint>()

function onBreakpointChange(b: Breakpoint) {
  bp.value = b
}
</script>
```
