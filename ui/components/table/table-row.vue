<template>
  <tr
    :class="[
      cls.e('row'),
      bem.is('expanded', row.expanded),
      bem.is('current', row.isCurrent)
    ]"
    @click="handleRowClick(row)"
  >
    <UTabelCell
      v-if="expandColumn"
      :column="expandColumn"
      :left="expandColumn.style.left"
      :right="expandColumn.style.right"
      :key="expandColumn.key + expandColumn.keySuffix"
    >
      <u-button
        v-if="!row.isLeaf"
        text
        :class="cls.e('expand-toggle')"
        type="primary"
        size="small"
        circle
        @click.stop="toggleTreeRowExpand(row)"
        :style="`margin-left: ${(row.depth - 1) * 14}px`"
      >
        <u-icon><ArrowRight /></u-icon>
      </u-button>
      <i
        v-else
        :class="cls.e('expand-space')"
        :style="`margin-left: ${(row.depth - 1) * 14}px`"
      ></i>
      <u-node-render
        :content="getColumnSlotsNode(getCellCtx(row, expandColumn))"
      />
    </UTabelCell>

    <UTabelCell
      v-for="column of columns"
      :column="column"
      :left="column.style.left"
      :right="column.style.right"
      :key="column.key + column.keySuffix"
    >
      <u-node-render :content="getColumnSlotsNode(getCellCtx(row, column))" />
    </UTabelCell>
  </tr>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { TableDIKey } from './di'
import type { TableRow } from './use-rows'
import { UNodeRender } from '../node-render'
import UTabelCell from './table-cell.vue'
import { bem } from '@ui/utils'
import { ArrowRight } from 'icon-ultra'
import { UButton } from '../button'
import { UIcon } from '../icon'

defineOptions({
  name: 'TableRow'
})

defineProps<{
  row: TableRow
}>()

const {
  cls,
  columnConfig,
  getColumnSlotsNode,
  toggleTreeRowExpand,
  getCellCtx,
  handleRowClick
} = inject(TableDIKey)!

const { columns, expandColumn } = columnConfig
</script>
