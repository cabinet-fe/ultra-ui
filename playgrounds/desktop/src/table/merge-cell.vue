<template>
  <CustomCard title="合并单元格">
    <u-table
      :data="data"
      :merge-cell="mergeCell"
      v-if="!reloading"
      :columns="columns"
      style="height: 300px"
      :stripe="false"
      border
    >
      <template #column:secondQuota="{ val, row }">
        <span>{{ val }}</span>
        <u-button circle type="primary" :icon="Plus" @click="handleAdd(row)"></u-button>
      </template>

      <template #column:thirdQuota="{ model }">
        <u-input v-bind="model"></u-input>
      </template>
    </u-table>
  </CustomCard>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@veltra/desktop'
import type { TableRow } from '@veltra/desktop'
import { Plus } from '@veltra/icons/normal'
import { nextTick, shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

let data = shallowRef<Record<string, any>[]>([
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

const columns = defineTableColumns([
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

  keys.forEach((key) => {
    keyDict[key] = data.value.reduce((acc, item, index) => {
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
  data.value = [
    ...data.value.slice(0, row.index + 1),
    {
      firstQuota: row.data.firstQuota,
      secondQuota: row.data.secondQuota,
      thirdQuota: ''
    },
    ...data.value.slice(row.index + 1)
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
