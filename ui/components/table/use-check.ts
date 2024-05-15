import {
  computed,
  createVNode,
  shallowReactive,
  shallowRef,
  watch,
  type ShallowRef
} from 'vue'
import type { TableRow } from './use-rows'
import { UCheckbox } from '../checkbox'
import type {
  TableColumn,
  TableEmits,
  TableProps
} from '@ui/types/components/table'
import type { Forest } from 'cat-kit/fe'

interface Options {
  rows: ShallowRef<TableRow[] | undefined>
  rowForest: ShallowRef<Forest<TableRow> | undefined>
  props: TableProps
  emit: TableEmits<any>
}

export function useCheck(options: Options) {
  const { rows, rowForest, props, emit } = options

  const checkedRows = shallowReactive(new Set<TableRow>())
  const selectedRow = shallowRef<TableRow>()

  watch(selectedRow, selectedRow => {
    emit('update:selected', selectedRow?.value)
  })

  watch(checkedRows, checkedRows => {
    emit(
      'update:checked',
      Array.from(checkedRows).map(row => row.value)
    )
  })

  const allChecked = computed(() => {
    return (
      (props.tree ? rowForest.value?.size : rows.value?.length) ===
      checkedRows.size
    )
  })

  function handleCheckAllTree(check: boolean) {
    if (check) {
      rowForest.value?.dft(row => {
        row.checked = true
        checkedRows.add(row)
      })
    } else {
      rowForest.value?.dft(row => {
        row.checked = false
      })
      checkedRows.clear()
    }
  }

  function handleCheckAllRows(check: boolean) {
    if (check) {
      rows.value?.forEach(row => {
        row.checked = true
        checkedRows.add(row)
      })
    } else {
      rows.value?.forEach(row => {
        row.checked = false
      })
      checkedRows.clear()
    }
  }

  function handleCheckAll(check: boolean) {
    if (props.tree) {
      handleCheckAllTree(check as boolean)
    } else {
      handleCheckAllRows(check as boolean)
    }
  }

  function handleCheckRow(row: TableRow, check: boolean) {
    // 减少判断的写法
    if (check) {
      row.dft(child => {
        child.checked = check
        checkedRows.add(child)
      })
    } else {
      row.dft(child => {
        child.checked = check
        checkedRows.delete(child)
      })
    }
  }

  function createCheckColumn(): TableColumn {
    return {
      key: '__is_check_column',
      name: '',
      minWidth: props.tree ? 60 : undefined,
      width: props.tree ? undefined : 60,
      align: props.tree ? 'left' : 'center',
      fixed: 'left',
      nameRender() {
        return createVNode(UCheckbox, {
          modelValue: allChecked.value,
          'onUpdate:modelValue': handleCheckAll
        })
      },
      render(ctx) {
        const { row } = ctx
        return createVNode(UCheckbox, {
          modelValue: row.checked,
          'onUpdate:modelValue': (val: boolean) => {
            handleCheckRow(row, val)
          }
        })
      }
    }
  }

  function handleSelect(row: TableRow, check: boolean) {
    row.checked = check
    if (check) {
      if (selectedRow.value) {
        selectedRow.value.checked = false
      }
      selectedRow.value = row
    } else {
      selectedRow.value = undefined
    }
  }

  function createSelectColumn(): TableColumn {
    return {
      key: '__is_select_column',
      name: '单选',
      minWidth: props.tree ? 60 : undefined,
      width: props.tree ? undefined : 60,
      align: props.tree ? 'left' : 'center',
      fixed: 'left',

      render({ row }) {
        return createVNode(UCheckbox, {
          modelValue: row.checked,
          'onUpdate:modelValue': (val: boolean) => {
            handleSelect(row, val)
          }
        })
      }
    }
  }

  return {
    createCheckColumn,
    createSelectColumn
  }
}
