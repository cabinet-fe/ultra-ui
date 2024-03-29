<template>
  <thead :class="cls.e('head')" ref="">
    <tr v-for="(header, headerIndex) of headers">
      <th
        :class="cls.e('cell')"
        v-for="col of header"
        :colspan="col.leafs"
        :rowspan="
          col.children?.length ? undefined : headers.length - headerIndex
        "
      >
        {{ col.colName }}
      </th>
    </tr>
  </thead>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { TableDIKey } from './di'

defineOptions({
  name: 'TableHead'
})

const { cls, columnConfig } = inject(TableDIKey)!

const { headers } = columnConfig
</script>
