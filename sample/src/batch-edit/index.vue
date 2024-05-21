<template>
  <div>
    <div>
      <u-checkbox v-model="readonly">只读</u-checkbox>
      <u-checkbox v-model="resizable">可调节尺寸</u-checkbox>
    </div>

    <u-batch-edit
      :columns="columns"
      :readonly="readonly"
      :resizable="resizable"
      v-model:data="data"
      style="height: 400px"
      :model="model"
      cols="1fr 1fr"
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
import { shallowRef } from 'vue'

const readonly = shallowRef(false)
const resizable = shallowRef(true)

const columns = defineTableColumns([
  { name: '名称', key: 'name' },
  { name: '年龄', key: 'age' }
])

const data = shallowRef(
  Array.from({ length: 2 }).map((_, i) => ({
    name: '姓名' + i,
    age: Math.ceil(Math.random() * 80)
  }))
)

const model = new FormModel({
  name: { required: true },
  age: { required: true, max: 100 }
})
</script>

<style lang="scss" scoped></style>
