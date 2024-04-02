<template>
  <div>
    <CustomCard title="基础使用">
      <u-table :data="data" :columns="columns.slice(0, -1)">
        <template #column:name="{ row }">
          {{ row.value.name }}
        </template>
      </u-table>
    </CustomCard>

    <CustomCard title="多级表头和表头冻结">
      <u-table :data="data" :columns="columns" style="height: 300px"> </u-table>
    </CustomCard>

    <CustomCard title="冻结列">
      <u-table :data="data" :columns="columns" style="height: 300px"> </u-table>
    </CustomCard>

    <CustomCard title="表格插槽">
      <u-table :data="data" :columns="columns">
        <template #column:name="{ row, column }">
          <u-input v-model="row.value[column.key]" />
        </template>
        <template #column:age="{ row }">
          <u-number-input v-model="row.value.age" />
        </template>
        <template #column:sex="{ row }">
          <u-radio-group
            :items="[
              { label: '男', value: '男' },
              { label: '女', value: '女' }
            ]"
            v-model="row.value.sex"
          />
        </template>

        <template #header:name="{ column }">
          <span style="color: red">
            {{ column.key }}
          </span>
        </template>
      </u-table>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { defineTableColumns } from 'ultra-ui'
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'

const columns = defineTableColumns(
  [
    { name: '姓名', key: 'name', align: 'center' },
    { name: '年龄', key: 'age' },
    { name: '性别', key: 'sex' },
    {
      name: '地址',
      key: 'address',
      children: [
        { name: '省', key: 'province' },
        { name: '市', key: 'city' },
        { name: '区', key: 'area' },
        { name: '街道', key: 'street' },
        {
          name: '小区',
          key: 'community',
          children: [
            { name: 'a', key: 'a' },
            { name: 'b', key: 'b' }
          ]
        }
      ]
    }
  ],
  { minWidth: 180 }
)

const data = shallowRef(
  Array.from({ length: 20 }).map((_, index) => {
    return {
      sex: index % 2 === 0 ? '男' : '女',
      name: 'name1' + index,
      age: Math.random() * 100,
      province: '江苏省' + index,
      city: '苏州市' + index,
      area: '姑苏区' + index,
      street: '金昌街道' + index,
      community: '彩香花园' + index
    }
  })
)
</script>
