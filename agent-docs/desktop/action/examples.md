---
title: UAction / UActionGroup 示例
description: 用操作组收纳表格行内按钮，超出 max 的项进入下拉，危险操作走确认
---

`UAction` 继承按钮外观，真正的点击走 `@run`（`need-confirm` 时在弹窗确认后才触发）。放进 `UActionGroup` 后，组上的 `size` / `text` / `type` / `circle` / `loading` 作为子项默认值，单个 `UAction` 可覆盖。超出 `max`（默认 3）的项收进下拉；`in-dropdown` 为 true 时该项始终进下拉。

## UActionGroup 收纳行内操作

```vue
<script setup lang="ts">
function onView() {}
function onEdit() {}
function onDelete() {}
</script>

<template>
  <u-action-group :max="3">
    <u-action @run="onView">查看</u-action>
    <u-action @run="onEdit">编辑</u-action>
    <u-action need-confirm type="danger" @run="onDelete">删除</u-action>
  </u-action-group>
</template>
```

组默认 `text` 为 true、`type` 为 `primary`、`size` 为 `small`。需要实心按钮时在组上写 `:text="false"`。

## UAction 单独使用

不进组时仍可用 `need-confirm` 与 `@run`：

```vue
<script setup lang="ts">
function onArchive() {}
</script>

<template>
  <u-action need-confirm type="warning" @run="onArchive">归档</u-action>
</template>
```
