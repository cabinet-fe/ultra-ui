export { default as UTable } from './table.vue'

export type {
  TableProps,
  TableEmits,
  TableExposed,
  TableRow,
  TableColumn
} from '@ui/types/components/table'

export { defineTableColumns } from './use-columns'