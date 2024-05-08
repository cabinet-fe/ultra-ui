export { default as UTable } from './table.vue'

export type {
  TableProps,
  TableEmits,
  TableExposed,
  TableRow,
  TableColumn
} from '@ui/types/components/table'

export type { TableColumnSlotsScope } from './di'

export { defineTableColumns, type ColumnNode } from './use-columns'