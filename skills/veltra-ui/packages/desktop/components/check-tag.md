# UCheckTag — 可选标签

> `import type { CheckTagProps, CheckTagEmits, CheckTagExposed } from '@veltra/desktop'`

## Import

```ts
// UCheckTag 由 Vite 自动导入，无需手动 import
```

## Props

| prop         | type      | default | 说明                       |
| ------------ | --------- | ------- | -------------------------- |
| `modelValue` | `boolean` | —       | 双向绑定的选中状态         |
| `checked`    | `boolean` | —       | 当前是否选中，控制视觉样式 |

## Emits

| event               | 参数                                                       |
| ------------------- | ---------------------------------------------------------- |
| `update:modelValue` | `(value: boolean)` — 点击时将当前 `checked` 值作为新值抛出 |

## Slots

| slot      | 作用域 | 说明     |
| --------- | ------ | -------- |
| `default` | —      | 标签内容 |

## Exposed

```ts
interface CheckTagExposed {}
```

无暴露属性或方法。

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const checked = ref(false)
</script>

<template>
  <u-check-tag v-model="checked">标签</u-check-tag>
</template>
```

### 受控用法

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

### 多选标签组

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
