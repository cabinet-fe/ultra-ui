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
</template>

<script lang="ts" setup>
import { defineTableColumns, type TableRow } from '@ultra-ui/pc'
import type { TableColumnRenderContext } from '@ultra-ui/pc/types'
import { nextTick, shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'
import { Plus } from '@lucide/vue'

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

type SpanCell = { times: number; start: number }
type SpanDict = Record<string, Record<string, SpanCell>>

function getValSpanDict(keys: string[]): SpanDict {
  const keyDict: SpanDict = {}

  keys.forEach(key => {
    keyDict[key] = data.value.reduce<Record<string, SpanCell>>((acc, item, index) => {
      const cell = item[key] as string
      if (acc[cell]) {
        acc[cell].times++
      } else {
        acc[cell] = {
          times: 1,
          start: index
        }
      }
      return acc
    }, {})
  })

  return keyDict
}

let columnsSpanDict: SpanDict = getValSpanDict(['firstQuota', 'secondQuota'])
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

function mergeCell(ctx: TableColumnRenderContext) {
  const { row, column, val } = ctx
  const key = column.key as string
  const valKey = String(val)

  const cellSpan = columnsSpanDict[key]?.[valKey]
  if (cellSpan) {
    const { times, start } = cellSpan

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
