# UDropdown 示例

## 悬浮触发

```vue
<template>
  <UDropdown>
    <template #trigger>
      <UButton>悬浮打开</UButton>
    </template>
    <template #content>
      <div style="padding: 8px 12px">菜单内容</div>
    </template>
  </UDropdown>
</template>
```

## 点击触发

```vue
<template>
  <UDropdown trigger="click">
    <template #trigger>
      <UButton>点击打开</UButton>
    </template>
    <template #content>
      <div style="padding: 8px 12px">点击触发的菜单</div>
    </template>
  </UDropdown>
</template>
```

## 受控模式 + 键盘事件

```vue
<template>
  <UDropdown
    trigger="click"
    :visible="visible"
    @update:visible="visible = $event"
    @keydown="handleKeydown"
  >
    <template #trigger>
      <UButton>受控下拉</UButton>
    </template>
    <template #content>
      <div style="padding: 8px 12px">按 Esc 关闭</div>
    </template>
  </UDropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    visible.value = false
  }
}
</script>
```

## 禁用状态

```vue
<template>
  <UDropdown disabled>
    <template #trigger>
      <UButton disabled>禁用状态</UButton>
    </template>
    <template #content>
      <div style="padding: 8px 12px">不会弹出</div>
    </template>
  </UDropdown>
</template>
```
