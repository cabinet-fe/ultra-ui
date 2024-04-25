<template>
  <thead :class="cls.e('head')" ref="">
    <tr v-for="(header, headerIndex) of headers">
      <th
        v-for="column of header"
        :class="getCellClass(column)"
        :key="column.key"
        :colspan="column.leafs"
        :rowspan="
          column.children?.length ? undefined : headers.length - headerIndex
        "
        :style="{
          left: withUnit(column.style.left, 'px'),
          right: withUnit(column.style.right, 'px')
        }"
      >
        <u-node-render
          :content="
            getHeaderSlotsNode(column.key, {
              column
            })
          "
        />
      </th>
    </tr>
  </thead>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { TableDIKey } from './di'
import { UNodeRender } from '../node-render'
import { withUnit } from '@ui/utils'

defineOptions({
  name: 'TableHead'
})

const { cls, columnConfig, getHeaderSlotsNode, getCellClass } = inject(TableDIKey)!

const { headers } = columnConfig
</script>
