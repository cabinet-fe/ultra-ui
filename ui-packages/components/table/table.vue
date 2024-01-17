<template>
  <div :class="cls.b">

  </div>
</template>

<script lang="ts" setup generic="DataItem extends Record<string, any>">
import type { TableProps, TableEmits } from '@ui/types/components/table'
import { bem } from '@ui/utils'
import { provide } from 'vue'
import { TableDIKey } from './di'

defineOptions({
  name: 'Table'
})

const props = defineProps<TableProps<DataItem>>()
const emit = defineEmits<TableEmits<DataItem>>()

const cls = bem('table')

provide(TableDIKey, {
  tableProps: props,
  cls
})
</script>
