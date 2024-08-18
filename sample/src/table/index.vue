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
      <u-checkbox v-model="state.editing">编辑模式</u-checkbox>
      <u-checkbox v-model="state.highlightCurrent">高亮选中行</u-checkbox>

      <u-table
        :data="data"
        :columns="columns"
        :style="{
          height: fixedHeight ? '700px' : ''
        }"
        row-key="name"
        v-bind="state"
        v-model:checked="checked"
        v-model:selected="selected"
      >
        <template #header:age> 年龄 </template>

        <!-- <template v-if="state.editing"> -->
        <template #column:age="{ model }" v-if="state.editing">
          <u-number-input v-bind="model"></u-number-input>
        </template>
        <!-- </template> -->
      </u-table>
    </CustomCard>

    <CustomCard title="合并单元格">
      <u-table
        :data="data2"
        :merge-cell="mergeCell"
        :columns="columns2"
      ></u-table>
    </CustomCard>

    <CustomCard title="编辑">
      <u-table
        :data="data2"
        :columns="columns2"
        checkable
        v-model:checked="checked2"
        row-key="id"
      >
        <template #column:third="{ model }">
          <u-input v-bind="model"></u-input>
        </template>
      </u-table>
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
  highlightCurrent: false,
  editing: false
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

const _data = Array.from({ length: 1000 }).map((_, index) => {
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
    a: 'aa'
    // children: [
    //   {
    //     sex: '未知',
    //     name: 'name' + index + '-0',
    //     age: Math.round(Math.random() * 100),
    //     province: '江苏省',
    //     city: '苏州市',
    //     area: '姑苏区',
    //     street: '金昌街道',
    //     community: '彩香花园',
    //     b: 'aa',
    //     a: 'aa',
    //     children: [
    //       {
    //         sex: '未知',
    //         name: 'name' + index + '-0-0',
    //         age: Math.round(Math.random() * 100),
    //         province: '江苏省',
    //         city: '苏州市',
    //         area: '姑苏区',
    //         street: '金昌街道',
    //         community: '彩香花园',
    //         b: 'aa',
    //         a: 'aa'
    //       }
    //     ]
    //   }
    // ]
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

const checked = shallowRef([])
const checked2 = shallowRef<any[]>([])
const selected = shallowRef(data.value[0]!)

setTimeout(() => {
  checked2.value = [{ id: 11 }]
}, 2000)

const data2 = [
  { id: 11, first: '决策', second: '立项', third: '立项依据充分性' },
  { id: 22, first: '决策', second: '立项', third: '立项程序规范性' },
  { id: 33, first: '决策', second: '绩效目标', third: '绩效目标合理性' },
  { id: 44, first: '决策', second: '绩效目标', third: '绩效指标明确性' },
  { id: 55, first: '过程', second: '资金管理', third: '资金到位率' },
  { id: 66, first: '过程', second: '资金管理', third: '预算执行率' },
  { id: 77, first: '过程', second: '资金管理', third: '资金使用合规性' },
  { id: 88, first: '过程', second: '组织实施', third: '制度执行有效性' }
]

const columns2 = defineTableColumns([
  { name: '三级指标', key: 'third' },
  { name: '一级指标', key: 'first' },
  { name: '二级指标', key: 'second' }
])

function getValSpanDict(keys: string[]) {
  const keyDict = {}

  keys.forEach(key => {
    keyDict[key] = data2.reduce((acc, item, index) => {
      if (acc[item[key]]) {
        acc[item[key]].times++
      } else {
        acc[item[key]] = {
          times: 1,
          start: index
        }
      }
      return acc
    }, {})
  })

  return keyDict
}

const columnsSpanDict = getValSpanDict(['first', 'second'])

function mergeCell(ctx) {
  const { row, column, val } = ctx

  if (columnsSpanDict[column.key]) {
    const { times, start } = columnsSpanDict[column.key][val]
    if (start === row.index) {
      return {
        rowspan: times,
        colspan: 1
      }
    }
    return {
      rowspan: 0,
      colspan: 0
    }
  }
}
</script>
