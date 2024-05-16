<template>
  <tr
    :class="[cls.e('row'), bem.is('expanded', row.expanded)]"
    @click="eventHandlers.handleRowClick(row)"
  >

    <UTabelCell
      v-if="firstColumn"
      :column="firstColumn"
      :left="firstColumn.style.left"
      :right="firstColumn.style.right"
      :key="firstColumn.key"
    >
      <u-button
        v-if="!row.isLeaf"
        text
        :class="cls.e('expand-toggle')"
        type="primary"
        size="small"
        circle
        @click="toggleTreeRowExpand(row)"
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
        :content="getColumnSlotsNode(getCellCtx(row, firstColumn))"
      />
    </UTabelCell>

    <UTabelCell
      v-for="column of columns"
      :column="column"
      :left="column.style.left"
      :right="column.style.right"
      :key="column.key"
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
  eventHandlers
} = inject(TableDIKey)!

const { columns, firstColumn } = columnConfig
</script>
