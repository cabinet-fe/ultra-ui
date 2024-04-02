<template>
  <thead :class="cls.e('head')" ref="">
    <tr v-for="(header, headerIndex) of headers">
      <th
        v-for="col of header"
        :class="[cls.e('cell'), cls.em('cell', col.align)]"
        :key="col.key"
        :colspan="col.leafs"
        :rowspan="
          col.children?.length ? undefined : headers.length - headerIndex
        "
      >
        <u-node-render
          :content="
            getHeaderSlotsNode(col.key, {
              column: col
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

defineOptions({
  name: 'TableHead'
})

const { cls, columnConfig, getHeaderSlotsNode } = inject(TableDIKey)!

const { headers } = columnConfig
</script>
