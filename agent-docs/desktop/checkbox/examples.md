---
title: UCheckbox / UCheckboxButton 示例
description: 复选框与复选按钮的独立绑定，以及在 UForm 内用 field 绑定
---

`UCheckbox` 绑定布尔值。`UCheckboxButton` 是按钮形态，可用 `type`（`primary` / `info` / `success` / `warning` / `danger`）和 `round`。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。

`UCheckbox`：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const agreed = ref(false)
</script>

<template>
  <u-checkbox v-model="agreed">我已阅读并同意</u-checkbox>
  <u-checkbox v-model="agreed" indeterminate>半选</u-checkbox>
</template>
```

`UCheckboxButton`：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const deepThink = ref(false)
</script>

<template>
  <u-checkbox-button v-model="deepThink" type="success">深度思考</u-checkbox-button>
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ remember: false, deepThink: false })
</script>

<template>
  <u-form :model="form">
    <u-checkbox label="记住登录" field="remember">30 天内免登录</u-checkbox>
    <u-checkbox-button label="能力" field="deepThink" type="success">深度思考</u-checkbox-button>
  </u-form>
</template>
```
