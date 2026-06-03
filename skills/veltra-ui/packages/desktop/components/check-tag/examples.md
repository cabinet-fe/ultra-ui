# UCheckTag 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const checked = ref(false)
</script>

<template>
  <u-check-tag v-model="checked">标签</u-check-tag>
</template>
```

## 受控用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const checked = ref(true)

function handleChange(value: boolean) {
  console.log('checked:', value)
}
</script>

<template>
  <u-check-tag :checked="checked" @update:model-value="handleChange"> 受控标签 </u-check-tag>
</template>
```

## 多选标签组

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const tags = reactive([
  { label: 'Vue', checked: false },
  { label: 'React', checked: true },
  { label: 'Angular', checked: false }
])
</script>

<template>
  <div class="tag-group">
    <u-check-tag v-for="tag in tags" :key="tag.label" v-model="tag.checked">
      {{ tag.label }}
    </u-check-tag>
  </div>
</template>
```
