---
title: USwitch 示例
description: 开关与开/关文案，以及在 UForm 内用 field 绑定
---

值为布尔。`active-text` / `inactive-text` 分别显示在开、关侧。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。

独立使用：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const enabled = ref(false)
</script>

<template>
  <u-switch v-model="enabled" />
  <u-switch v-model="enabled" active-text="开" inactive-text="关" />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ enabled: true, notification: false })
</script>

<template>
  <u-form :model="form">
    <u-switch label="启用状态" field="enabled" active-text="启用" inactive-text="禁用" />
    <u-switch label="推送通知" field="notification" />
  </u-form>
</template>
```
