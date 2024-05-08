<template>
  <div>
    <CustomCard title="基础使用">
      <u-table :data="data" :columns="columns" v-loading:[type]="loading" />
    </CustomCard>

    <u-radio-group :items="items" v-model="type"></u-radio-group>
    <u-button @click="load">加载数据</u-button>
 </div>
</template>

<script lang="ts" setup>
import { defineTableColumns } from 'ultra-ui'
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'

let loading = shallowRef(false)
const items = [
  { label: 'classic', value: 'classic' },
  { label: 'dot', value: 'dot' },
  { label: 'spinner', value: 'spinner' },
  { label: 'line', value: 'line' }
]

const type = shallowRef('spinner')
const columns = defineTableColumns(
  [
    { name: '姓名', key: 'name', align: 'center', fixed: 'left' },
    { name: '年龄', key: 'age', fixed: 'left' },
    { name: '性别', key: 'sex', fixed: 'right' },
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
          fixed: 'right',
          children: [
            { name: 'a', key: 'a', fixed: 'right' },
            { name: 'b', key: 'b', fixed: 'right' }
          ]
        }
      ]
    }
  ],
  { minWidth: 180 }
)

const data = shallowRef<any>([])

const load = () => {
  loading.value = true
  let time = setTimeout(() => {
    clearTimeout(time)
    data.value = Array.from({ length: 10 }).map((_, index) => {
      return {
        sex: index % 2 === 0 ? '男' : '女',
        name: 'name1' + index,
        age: Math.random() * 100,
        province: '江苏省' + index,
        city: '苏州市' + index,
        area: '姑苏区' + index,
        street: '金昌街道' + index,
        community: '彩香花园' + index,
        b: 'aa'
      }
    })
    loading.value = false
  }, 2000)
}

load()
</script>
