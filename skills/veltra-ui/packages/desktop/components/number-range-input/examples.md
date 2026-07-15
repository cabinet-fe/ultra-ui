# UNumberRangeInput 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const range = ref<[number | undefined, number | undefined]>([10, 50])
</script>

<template>
  <u-number-range-input v-model="range" :min="0" :max="100" />
</template>
```

## 分别绑定 start / end

交叉约束：任一侧越界时会校正（改 start 且 `start > end` 时压回 end；改 end 且 `end < start` 时抬到 start）。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const start = ref<number>()
const end = ref<number>()
</script>

<template>
  <u-number-range-input
    v-model:start="start"
    v-model:end="end"
    start-placeholder="最低价"
    end-placeholder="最高价"
    separator="至"
  />
</template>
```

## 货币模式 + 倍数

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 内部以"分"为单位存储，显示 ¥100.00 ~ ¥500.00
const priceRange = ref<[number | undefined, number | undefined]>([10000, 50000])
</script>

<template>
  <u-number-range-input v-model="priceRange" currency :multiple="100" :precision="2" :step="100" />
</template>
```

## 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ priceRange: [0, 1000] as [number | undefined, number | undefined] })
</script>

<template>
  <u-form :model="formData">
    <u-number-range-input field="priceRange" label="价格区间" currency :precision="2" />
  </u-form>
</template>
```
