<template>
  <thead :class="[cls.e('head'), bem.is('multistage', headers.length > 1)]">
    <tr v-for="(header, headerIndex) of headers">
      <th
        v-for="column of header"
        :class="getCellClass(column)"
        :key="column.key + keySuffix"
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
            getHeaderSlotsNode({
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
import { bem, withUnit } from '@ui/utils'

defineOptions({
  name: 'TableHead'
})

const { cls, columnConfig, getHeaderSlotsNode, getCellClass } =
  inject(TableDIKey)!

const { headers } = columnConfig
</script>
