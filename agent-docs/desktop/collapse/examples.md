---
title: UCollapse / UCollapseItem 示例
description: 折叠面板用 v-model 控制展开项，手风琴模式一次只开一项
---

包在 `UCollapse` 里时，每项 `value` 必填，展开状态由父级 `v-model` 管理（数组可同时展开多项；`accordion` 时为单值）。不要给子项再写 `v-model`。独立使用 `UCollapseItem` 时才用布尔 `v-model`。

## UCollapse 同时展开多项

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { CollapseModelValue } from '@veltra/desktop'

const opened = ref<CollapseModelValue>(['basic'])
</script>

<template>
  <u-collapse v-model="opened">
    <u-collapse-item value="basic" title="基础信息">姓名、邮箱与部门。</u-collapse-item>
    <u-collapse-item value="secure" title="安全设置">密码与二次验证。</u-collapse-item>
    <u-collapse-item value="notify" title="通知" disabled>该项不可点。</u-collapse-item>
  </u-collapse>
</template>
```

`accordion` 时 `v-model` 用单个 `value`。标题区可用 `#header` 自定义，展开图标仍由组件渲染。

## UCollapseItem 独立使用

```vue
<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <u-collapse-item v-model="open" title="独立面板">
    不包在 UCollapse 内时，用布尔 v-model 控制展开。
  </u-collapse-item>
</template>
```
