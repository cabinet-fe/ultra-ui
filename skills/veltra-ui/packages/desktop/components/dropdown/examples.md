# UDropdown 示例

## 悬浮触发

```vue
<template>
  <u-dropdown>
    <template #trigger>
      <u-button>悬浮打开</u-button>
    </template>
    <template #content>
      <div style="padding: 8px 12px">菜单内容</div>
    </template>
  </u-dropdown>
</template>
```

## 点击触发

```vue
<template>
  <u-dropdown trigger="click">
    <template #trigger>
      <u-button>点击打开</u-button>
    </template>
    <template #content>
      <div style="padding: 8px 12px">点击触发的菜单</div>
    </template>
  </u-dropdown>
</template>
```

## 受控模式 + 键盘事件

```vue
<template>
  <u-dropdown
    trigger="click"
    :visible="visible"
    @update:visible="visible = $event"
    @keydown="handleKeydown"
  >
    <template #trigger>
      <u-button>受控下拉</u-button>
    </template>
    <template #content>
      <div style="padding: 8px 12px">按 Esc 关闭</div>
    </template>
  </u-dropdown>
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
  <u-dropdown disabled>
    <template #trigger>
      <u-button disabled>禁用状态</u-button>
    </template>
    <template #content>
      <div style="padding: 8px 12px">不会弹出</div>
    </template>
  </u-dropdown>
</template>
```
