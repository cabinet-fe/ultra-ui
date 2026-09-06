---
title: UGroupInput 示例
description: 动态增删一组条目；表单内用 field 绑数组，条目内控件对 item 用 v-model
---

`UGroupInput` 绑定对象数组。默认 `creatable` 为 `true`，可用 `max`、`item-default`、`item-style`。插槽参数是 `{ item, index }`，`item` 是当前条目对象。独立使用时外层走 `v-model`；放进 `UForm` 时外层用 `field`，条目内控件对 `item` 写 `v-model`（不是 form 的 field）。

独立使用：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const users = shallowRef<{ name: string; age: string }[]>([])
</script>

<template>
  <u-group-input v-model="users" :max="5" :item-default="{ name: '', age: '' }">
    <template #default="{ item }">
      <u-input v-model="item.name" placeholder="姓名" />
      <u-input v-model="item.age" placeholder="年龄" />
    </template>
  </u-group-input>
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ contacts: [] as { name: string; phone: string }[] })
</script>

<template>
  <u-form :model="form">
    <u-group-input label="联系人" field="contacts" :max="5" creatable span="full">
      <template #default="{ item }">
        <u-input v-model="item.name" placeholder="姓名" />
        <u-input v-model="item.phone" placeholder="电话" />
      </template>
    </u-group-input>
  </u-form>
</template>
```
