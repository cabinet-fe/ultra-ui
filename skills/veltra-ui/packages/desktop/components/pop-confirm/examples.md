# UPopConfirm 示例

## 基础用法

```vue
<script setup lang="ts">
const handleDelete = () => {
  console.log('已确认删除')
}
</script>

<template>
  <u-pop-confirm title="确定要删除吗？" @confirm="handleDelete">
    <template #reference>
      <u-button type="danger">删除</u-button>
    </template>
  </u-pop-confirm>
</template>
```

## 自定义文字与方向

```vue
<script setup lang="ts">
const handleSubmit = () => {
  console.log('已提交')
}

const handleCancel = () => {
  console.log('已取消')
}
</script>

<template>
  <u-pop-confirm
    title="提交后不可撤回，确认提交？"
    confirm-text="提交"
    cancel-text="再想想"
    direction="top"
    @confirm="handleSubmit"
    @cancel="handleCancel"
  >
    <template #reference>
      <u-button type="primary">提交</u-button>
    </template>
  </u-pop-confirm>
</template>
```

## 自定义图标

```vue
<script setup lang="ts">
import { WarningFilled } from '@veltra/icons/normal'

const handleConfirm = () => {
  console.log('已确认')
}
</script>

<template>
  <u-pop-confirm
    title="此操作不可逆"
    :icon="WarningFilled"
    icon-color="#e84235"
    @confirm="handleConfirm"
  >
    <template #reference>
      <u-button type="danger" plain>危险操作</u-button>
    </template>
  </u-pop-confirm>
</template>
```

## hover 触发

```vue
<script setup lang="ts">
import { Delete } from '@veltra/icons/normal'

const handleDelete = () => {
  console.log('已确认删除')
}
</script>

<template>
  <u-pop-confirm title="在表格中删除该项？" trigger="hover" alignment="start" @confirm="handleDelete">
    <template #reference>
      <u-button text type="danger" :icon="Delete">删除</u-button>
    </template>
  </u-pop-confirm>
</template>
```
