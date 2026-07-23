# useFocus 示例

## 绑定焦点事件

```vue
<script setup lang="ts">
import { useFocus } from '@veltra/compositions'

const { focus, handleFocus, handleBlur } = useFocus((focused) => {
  console.log(focused)
})
</script>

<template>
  <input :class="{ focused: focus }" @focus="handleFocus" @blur="handleBlur" />
</template>
```
