# UNumber 示例

## 格式化

```vue
<u-number :value="12345.678" format="currency" />
<!-- ¥12,345.68 -->

<u-number :value="0.856" format="percent" />
<!-- 85.6% -->

<u-number :value="12345.678" format="decimal" />
<!-- 12,345.678 -->
```

## 补间动画

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <u-number :value="count" tween :duration="1000" />
  <u-button type="primary" @click="count += 5000">增加</u-button>
</template>
```

## 精度控制

```vue
<u-number :value="3.14159" :precision="2" />
<!-- 3.14 -->

<u-number :value="12345.678" format="currency" :max-precision="0" />
<!-- ¥12,346 -->

<u-number :value="100" format="percent" :min-precision="2" />
<!-- 100.00% -->

<u-number :value="12345.678" :max-precision="1" />
<!-- 12,345.7 -->
```

## 对齐方式

```vue
<u-number :value="99.9" align="left" />
<u-number :value="99.9" align="center" />
<u-number :value="99.9" align="right" />
```
