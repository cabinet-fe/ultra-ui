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
      <u-checkbox v-model="state.showIndex">显示序号</u-checkbox>
      <u-checkbox v-model="state.highlightCurrent">高亮选中行</u-checkbox>

      <u-table
        v-if="true"
        :data="data"
        :columns="columns"
        :style="{
          height: fixedHeight ? '700px' : ''
        }"
        row-key="name"
        v-bind="state"
        v-model:checked="checked"
        v-model:selected="selected"
        ref="tableRef"
      >
        <template #header:age> 年龄 </template>

        <template #column:sort="{ row }">
          <!-- <u-button @click="handleSort(row.index)">向下</u-button> -->
        </template>

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
        v-if="!reloading"
        :columns="columns2"
      >
        <template #column:secondQuota="{ val, row }">
          <span>{{ val }}</span>
          <u-button
            circle
            type="primary"
            :icon="Plus"
            @click="handleAdd(row)"
          ></u-button>
        </template>

        <template #column:thirdQuota="{ model }">
          <u-input v-bind="model"></u-input>
        </template>
      </u-table>
    </CustomCard>

    <!-- <CustomCard title="编辑">
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
    </CustomCard> -->
  </div>
</template>

<script lang="ts" setup>
import { defineTableColumns, type TableRow } from 'ultra-ui'
import { nextTick, shallowReactive, shallowRef, watch } from 'vue'
import CustomCard from '../card/custom-card.vue'
import { arr, Tree } from 'cat-kit/fe'
import { Plus } from 'icon-ultra'

const state = shallowReactive({
  checkable: false,
  selectable: false,
  tree: false,
  showIndex: false,
  highlightCurrent: false,
  editing: false
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
    { name: '性别', key: 'sex', fixed: 'right' },
    { name: '姓名', key: 'name', fixed: 'left', align: 'center' },
    { name: '年龄', key: 'age', fixed: 'left', summary: true }
  ],
  { minWidth: 150 }
)

const columns = shallowRef<any[]>([])

watch(
  multiLevelHeader,
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

const _data = Array.from({ length: 10000 }).map((_, index) => {
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

function handleSort(index: number) {
  data.value = arr(data.value).move(index, index + 1)
}

const data = shallowRef<any[]>([])

setTimeout(() => {
  data.value = _data
}, 300)

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

let data2 = shallowRef<Record<string, any>[]>([
  {
    firstQuota: '决策',
    secondQuota: '项目立项',
    thirdQuota: '三级指标'
  },
  {
    firstQuota: '决策',
    secondQuota: '绩效目标',
    thirdQuota: '立项依据充分性3'
  },
  { firstQuota: '决策', secondQuota: '资金投入', thirdQuota: '' },
  {
    firstQuota: '过程',
    secondQuota: '资金管理',
    thirdQuota: ''
  },
  {
    firstQuota: '过程',
    secondQuota: '组织实施',
    thirdQuota: ''
  }
])

const columns2 = defineTableColumns([
  {
    name: '一级指标',
    key: 'firstQuota',
    align: 'center'
  },
  {
    name: '二级指标',
    key: 'secondQuota',
    align: 'center'
  },
  {
    name: '三级指标',
    key: 'thirdQuota',
    align: 'center'
  },
  {
    name: '年度指标值',
    key: 'quotaValue',
    align: 'center'
  },
  {
    name: '是否分解到项目',
    key: 'disassemble',
    align: 'center'
  }
])

function getValSpanDict(keys: string[]) {
  const keyDict = {}

  keys.forEach(key => {
    keyDict[key] = data2.value.reduce((acc, item, index) => {
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

let columnsSpanDict = getValSpanDict(['firstQuota', 'secondQuota'])
const reloading = shallowRef(false)
function handleAdd(row: TableRow) {
  data2.value = [
    ...data2.value.slice(0, row.index + 1),
    {
      firstQuota: row.data.firstQuota,
      secondQuota: row.data.secondQuota,
      thirdQuota: ''
    },
    ...data2.value.slice(row.index + 1)
  ]

  reloading.value = true
  nextTick(() => {
    reloading.value = false
  })

  columnsSpanDict = getValSpanDict(['firstQuota', 'secondQuota'])
}

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
