<template>
  <div>
    <CustomCard title="使用方式">
      <u-checkbox
        v-model="state.checkable"
        @update:model-value="state.selectable = false"
      >
        多选
      </u-checkbox>
      <u-checkbox
        v-model="state.selectable"
        @update:model-value="state.checkable = false"
      >
        单选
      </u-checkbox>
      <u-checkbox v-model="state.tree">树形结构</u-checkbox>
      <u-checkbox v-model="fixedHeight">固定高度</u-checkbox>
      <u-checkbox v-model="multiLevelHeader">多级表头</u-checkbox>
      <u-checkbox v-model="showData">显示数据</u-checkbox>
      <u-checkbox v-model="state.highlightCurrent">高亮选中行</u-checkbox>
      <u-table
        :data="data"
        :columns="columns"
        :style="{
          height: fixedHeight ? '400px' : ''
        }"
        v-bind="state"
        v-model:checked="checked"
        v-model:selected="selected"
      >
        <template #header:age="{ column }">
          年龄 <u-checkbox v-model="column.data.summary">合计</u-checkbox>
        </template>
        <template #column:age="{ column, row }">
          {{ row.indexes }}
          {{ row.isLeaf ? '是叶子节点' : '不是叶子节点' }}
        </template>
        <!-- <template #foot="{ columns }">
          <tr>
            <td v-for="col of columns">{{ col.key }}</td>
          </tr>
        </template> -->
      </u-table>

      {{checked}}
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { defineTableColumns } from 'ultra-ui'
import { shallowReactive, shallowRef, watch } from 'vue'
import CustomCard from '../card/custom-card.vue'
import { Tree } from 'cat-kit/fe'

const state = shallowReactive({
  checkable: false,
  selectable: true,
  tree: false,
  highlightCurrent: false
})

const fixedHeight = shallowRef(true)
const multiLevelHeader = shallowRef(false)
const showData = shallowRef(true)

const _columns = defineTableColumns(
  [
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
    },
    { name: '性别', key: 'sex', fixed: 'right' },
    { name: '姓名', key: 'name', fixed: 'left' },
    { name: '年龄', key: 'age', fixed: 'left', summary: true }
  ],
  { minWidth: 150 }
)

const columns = shallowRef<any[]>([])

watch(
  () => multiLevelHeader.value,
  v => {
    if (v) {
      columns.value = _columns
    } else {
      let r: any[] = []

      Tree.dft({ children: _columns }, item => {
        if (item.children?.length) return
        r.push(item)
      })

      columns.value = r
    }
  },
  { immediate: true }
)

const _data = Array.from({ length: 10 }).map((_, index) => {
  return {
    sex: index % 2 === 0 ? '男' : '女',
    name: 'name' + index,
    age: Math.round(Math.random() * 100),
    province: '江苏省' + index,
    city: '苏州市' + index,
    area: '姑苏区' + index,
    street: '金昌街道' + index,
    community: '彩香花园' + index,
    b: 'aa',
    a: 'aa',
    children: [
      {
        sex: '未知',
        name: 'name',
        age: Math.round(Math.random() * 100),
        province: '江苏省',
        city: '苏州市',
        area: '姑苏区',
        street: '金昌街道',
        community: '彩香花园',
        b: 'aa',
        a: 'aa',
        children: [
          {
            sex: '未知',
            name: 'name',
            age: Math.round(Math.random() * 100),
            province: '江苏省',
            city: '苏州市',
            area: '姑苏区',
            street: '金昌街道',
            community: '彩香花园',
            b: 'aa',
            a: 'aa'
          }
        ]
      }
    ]
  }
})

const data = shallowRef(_data)

watch(showData, v => {
  if (v) {
    data.value = _data
  } else {
    data.value = []
  }
})

const checked = shallowRef([data.value[0]!, data.value[3]!])
const selected = shallowRef(data.value[0]!)
</script>
