<template>
  <CustomCard title="使用方式">
    <div>
      <u-button @click="toggleData" type="primary">
        {{ dataLen }}
        条数据
      </u-button>
    </div>

    <div style="display: flex; gap: 20px">
      <u-checkbox v-model="state.checkable" @update:model-value="state.selectable = false">
        多选
      </u-checkbox>
      <u-checkbox v-model="state.selectable" @update:model-value="state.checkable = false">
        单选
      </u-checkbox>
      <u-checkbox v-model="state.tree">树形结构</u-checkbox>
      <u-checkbox v-model="state.textEllipsis">文本溢出省略</u-checkbox>
      <u-checkbox v-model="fixedHeight">固定高度</u-checkbox>
      <u-checkbox v-model="multiLevelHeader">多级表头</u-checkbox>
      <u-checkbox v-model="showData">显示数据</u-checkbox>
      <u-checkbox v-model="state.editing">编辑模式</u-checkbox>
      <u-checkbox v-model="state.showIndex">显示序号</u-checkbox>
      <u-checkbox v-model="state.highlightCurrent">高亮选中行</u-checkbox>
      <u-checkbox v-model="state.border">边框</u-checkbox>
    </div>

    <u-table
      v-if="true"
      :data="data"
      :columns="columns"
      :style="{ height: fixedHeight ? '700px' : '' }"
      row-key="name"
      v-bind="state"
      v-model:checked="checked"
      v-model:selected="selected"
      ref="tableRef"
    >
      <template #header:age> 年龄 </template>

      <template #column:name="{ row }">
        <u-tag type="primary">{{ row.data.name }}</u-tag>
      </template>

      <!-- <template v-if="state.editing"> -->
      <template #column:age="{ model }" v-if="state.editing">
        <u-number-input v-bind="model"></u-number-input>
      </template>

      <!-- </template> -->
    </u-table>
  </CustomCard>
</template>

<script lang="ts" setup>
import { dfs } from '@cat-kit/core'
import { defineTableColumns } from '@ultra-ui/desktop'
import { computed, ref, shallowReactive, shallowRef, watch } from 'vue'

import CustomCard from '../card/custom-card.vue'

const state = shallowReactive({
  checkable: false,
  selectable: true,
  tree: false,
  showIndex: false,
  highlightCurrent: false,
  editing: false,
  textEllipsis: false,
  border: false
})

const fixedHeight = shallowRef(true)
const multiLevelHeader = shallowRef(true)
const showData = shallowRef(true)
const _columns = defineTableColumns(
  [
    {
      name: '排序',
      key: 'sort'
    },
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
    // { name: '性别', key: 'sex', fixed: 'right' },
    {
      name: '姓名',
      key: 'name',
      fixed: 'left',
      align: 'center',
      minWidth: 250,
      width: 200
      // headerAlign: 'left'
    },
    {
      name: '年龄',
      key: 'age',
      fixed: 'right',
      summary: true

      // headerAlign: 'center'
    }
  ],
  { minWidth: 100 }
)

const dataLen = shallowRef(1000)
const data = computed(() => {
  return Array.from({ length: dataLen.value }).map((_, index) => {
    return {
      sex: index % 2 === 0 ? '男' : '女',
      name: 'name' + index,
      age: Math.round(Math.random() * 100),
      province: '江苏省' + index,
      city: '苏州市' + index,
      area: '姑苏区' + index,
      street: `金昌街道${index}`.repeat(Math.round(Math.random() * 4)),
      community: `彩香花园${index}`,
      b: 'aa',
      a: 'aa',
      children: [
        {
          sex: '未知',
          name: 'name' + index + '-0',
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
              name: 'name' + index + '-0-0',
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
})
const checked = shallowRef([])
const selected = shallowRef(data.value[0]!)

const columns = shallowRef<any[]>([])

const toggleData = () => {
  dataLen.value = dataLen.value === 1000 ? 72 : 1000
}

watch(
  multiLevelHeader,
  (v) => {
    if (v) {
      columns.value = _columns
    } else {
      let r: any[] = []

      dfs({ children: _columns }, (item) => {
        if (item.children?.length) return
        r.push(item)
      })

      columns.value = r
    }
  },
  { immediate: true }
)
</script>
