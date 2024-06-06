export { default as UTable } from './table.vue'

export type {
  TableProps,
  TableEmits,
  TableExposed,
  TableRow,
  TableColumn,
  TableColumnSlotsScope
} from '@ui/types/components/table'

export { defineTableColumns, type ColumnNode } from './use-columns'
