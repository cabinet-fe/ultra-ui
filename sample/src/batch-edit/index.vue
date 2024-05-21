<template>
  <div>
    <u-batch-edit
      :columns="columns"
      v-model:data="data"
      disabled
      style="height: 400px"
      :model="model"
      :cols="['1fr', '1fr']"
    >
      <template #form="{ data }">
        <u-input field="name" label="名称" />
        <u-number-input field="age" label="年龄" />
        <u-number-input field="age" label="年龄" />
        <u-number-input field="age" label="年龄" />
        <u-number-input field="age" label="年龄" />
        <u-number-input field="age" label="年龄" />
        <u-number-input field="age" label="年龄" />
        <u-number-input field="age" label="年龄" />
      </template>
    </u-batch-edit>
  </div>
</template>

<script lang="ts" setup>
import { FormModel, defineTableColumns } from 'ultra-ui'

const columns = defineTableColumns([
  { name: '名称', key: 'name' },
  { name: '年龄', key: 'age' }
])

const data = Array.from({ length: 2 }).map((_, i) => ({
  name: '姓名' + i,
  age: Math.ceil(Math.random() * 80)
}))

const model = new FormModel({
  name: { required: true },
  age: { required: true }
})
</script>

<style lang="scss" scoped></style>
