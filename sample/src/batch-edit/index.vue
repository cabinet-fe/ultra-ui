<template>
  <div>
    <div>
      <u-checkbox v-model="readonly">只读</u-checkbox>
      <u-checkbox v-model="tree">树形</u-checkbox>
      <u-checkbox v-model="resizable">可调节尺寸</u-checkbox>
      <u-checkbox v-model="asynchronous">模拟异步</u-checkbox>
      <u-button @click="dialogVisible = !dialogVisible">弹框中</u-button>
    </div>
    <u-batch-edit
      :columns="columns"
      :readonly="readonly"
      :resizable="resizable"
      v-model:data="data"
      style="height: 400px"
      :model="model"
      :tree="tree"
      cols="1fr 1fr"
      :delete-method="asynchronous ? deleteMethod : undefined"
      :save-method="asynchronous ? saveMethod : undefined"
      @created="
        model.setData({
          age: 666
        })
      "
    >
      <template #form="{ data }">
        <u-input field="name" label="名称" />
        <u-number-input field="age" label="年龄" />
        <u-input field="props.label" label="标签" />
        <u-input field="props.field" label="字段" />
        <u-input v-if="!data.age || data.age < 10" field="cc" label="cc" />
      </template>
    </u-batch-edit>

    <u-dialog style="width: 900px" v-model="dialogVisible" title="字典项">
      <u-batch-edit
        :columns="columns"
        :readonly="readonly"
        :resizable="resizable"
        v-model:data="data"
        style="height: 400px"
        :model="model"
        :tree="tree"
        cols="1fr 1fr"
        :delete-method="asynchronous ? deleteMethod : undefined"
        :save-method="asynchronous ? saveMethod : undefined"
      >
        <template #form="{ data }">
          <u-input field="name" label="名称" />
          <u-number-input field="age" label="年龄" />
          <u-input field="props.label" label="标签" />
          <u-input field="props.field" label="字段" />
          <u-input v-if="!data.age || data.age < 10" field="cc" label="cc" />
        </template>
      </u-batch-edit>
    </u-dialog>

    {{ data }}
  </div>
</template>

<script lang="ts" setup>
import { sleep } from 'cat-kit/fe'
import { FormModel, Message, defineTableColumns, formField } from 'ultra-ui'
import { nextTick, shallowRef } from 'vue'

const readonly = shallowRef(false)
const tree = shallowRef(false)
const resizable = shallowRef(true)
const dialogVisible = shallowRef(false)

const columns = defineTableColumns([
  { name: '名称', key: 'name', rules: { required: true } },
  { name: '年龄', key: 'age', rules: { max: 120 } }
])

const data = shallowRef()
// Array.from({ length: 1 }).map((_, i) => ({
//   name: '姓名' + i,
//   age: Math.ceil(Math.random() * 80),
//   id: Math.random()
// }))

const model = new FormModel({
  name: { required: true },
  age: formField<number>({ max: 100 }),
  'props.field': {},
  'props.label': {},
  cc: { required: true }
})

const asynchronous = shallowRef(false)

const deleteMethod = async row => {
  await sleep(2000)
  await Promise.reject('a')
  Message.success('删除成功')
}

const saveMethod = async (data, type) => {
  await sleep(2000)
  Message.success('保存成功')
}
</script>

<style lang="scss" scoped></style>
