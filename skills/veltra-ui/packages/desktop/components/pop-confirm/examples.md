# UPopConfirm 示例

## 基础用法

```vue
<script setup lang="ts">
const handleDelete = () => {
  console.log('已确认删除')
}
</script>

<template>
  <UPopConfirm title="确定要删除吗？" @confirm="handleDelete">
    <template #reference>
      <UButton type="danger">删除</UButton>
    </template>
  </UPopConfirm>
</template>
```

## 自定义文字与方向

```vue
<UPopConfirm
  title="提交后不可撤回，确认提交？"
  confirm-text="提交"
  cancel-text="再想想"
  direction="top"
  @confirm="handleSubmit"
  @cancel="handleCancel"
>
  <template #reference>
    <UButton type="primary">提交</UButton>
  </template>
</UPopConfirm>
```

## 自定义图标

```vue
<script setup lang="ts">
import { WarningFilled } from '@veltra/icons/normal'
</script>

<template>
  <UPopConfirm
    title="此操作不可逆"
    :icon="WarningFilled"
    icon-color="#e84235"
    @confirm="handleConfirm"
  >
    <template #reference>
      <UButton type="danger" plain>危险操作</UButton>
    </template>
  </UPopConfirm>
</template>
```

## hover 触发

```vue
<UPopConfirm title="在表格中删除该项？" trigger="hover" alignment="start" @confirm="handleDelete">
  <template #reference>
    <UButton text type="danger" :icon="Delete">删除</UButton>
  </template>
</UPopConfirm>
```
