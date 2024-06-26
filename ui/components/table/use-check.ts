import {
  computed,
  createTextVNode,
  createVNode,
  nextTick,
  shallowReactive,
  shallowRef,
  toRaw,
  watch,
  type ComputedRef,
  type ShallowRef
} from 'vue'
import type { TableRow } from './use-rows'
import { UCheckbox } from '../checkbox'
import type {
  TableColumn,
  TableEmits,
  TableProps
} from '@ui/types/components/table'
import { getChainValue, type Forest } from 'cat-kit/fe'
import type { ComponentSize } from '@ui/types/component-common'
import type { BEM } from '@ui/utils'

interface Options {
  rows: ShallowRef<TableRow[] | undefined>
  rowForest: ShallowRef<Forest<TableRow> | undefined>
  props: TableProps
  emit: TableEmits<any>
  size: ComputedRef<ComponentSize>
  cls: BEM<'table'>
}

export function useCheck(options: Options) {
  const { rows, rowForest, props, emit, size, cls } = options

  const checkedRows = shallowReactive(new Set<TableRow>())
  const selectedRow = shallowRef<TableRow>()

  function clearChecked() {
    checkedRows.forEach(row => {
      row.checked = false
    })
    checkedRows.clear()
  }

  function clearSelected() {
    if (selectedRow.value) {
      selectedRow.value.checked = false
      selectedRow.value = undefined
    }
  }

  watch(
    [() => props.checkable, () => props.selectable, () => rows.value],
    () => {
      clearChecked()
      clearSelected()
    }
  )

  watch(selectedRow, selectedRow => {
    if (changedByModel) return
    changedByEvent = true
    emit(
      'update:selected',
      selectedRow?.data ? toRaw(selectedRow.data) : undefined
    )
    nextTick(() => {
      changedByEvent = false
    })
  })

  let changedByEvent = false
  let changedByModel = false
  watch(checkedRows, checkedRows => {
    if (changedByModel) return
    changedByEvent = true
    emit(
      'update:checked',
      Array.from(checkedRows).map(row => toRaw(row.data))
    )
    nextTick(() => {
      changedByEvent = false
    })
  })

  let dicts: Map<string | number, TableRow> | undefined = undefined

  function setDicts() {
    if (dicts || !rows.value || !props.rowKey) return

    let mapEntries: [string | number, TableRow][] = []
    let i = 0
    while (i < rows.value.length) {
      const row = rows.value[i]!
      mapEntries.push([row.uid, row])
      i++
    }
    dicts = new Map(mapEntries)
  }

  watch(rows, () => {
    dicts = undefined
  })

  watch(
    [() => props.checked, () => props.rowKey, () => props.checkable, rows],
    ([checked, rowKey, checkable, rows], [_, __, ___, oRows]) => {
      if (changedByEvent || !checkable || !rowKey) return

      changedByModel = true

      // 如果没有字典，先建立字典
      rows !== oRows && setDicts()

      clearChecked()

      checked?.forEach(item => {
        const row = dicts?.get(getChainValue(item, rowKey))
        if (!row) return

        row.checked = true
        checkedRows.add(row)
      })

      nextTick(() => {
        changedByModel = false
      })
    },
    {
      immediate: true
    }
  )

  watch(
    [() => props.selected, () => props.rowKey, () => props.selectable, rows],
    ([selected, rowKey, selectable, rows], [_, __, ___, oRows]) => {
      if (changedByEvent || !selectable || !rowKey) return

      changedByModel = true

      // 如果没有字典，先建立字典(懒建立)
      rows !== oRows && setDicts()

      if (selected) {
        const row = dicts?.get(getChainValue(selected, rowKey))
        if (row) {
          row.checked = true
          selectedRow.value = row
        }
      } else {
        clearSelected()
      }

      nextTick(() => {
        changedByModel = false
      })
    },
    {
      immediate: true
    }
  )

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

  const getCheckboxColumnWidth = () => {
    return size.value === 'large' ? 80 : 60
  }

  const checkboxClass = cls.e('checkbox')
  const checkboxClick = (e: Event) => e.stopPropagation()

  function createCheckColumn(): TableColumn {
    const width = getCheckboxColumnWidth()
    return {
      key: '__is_check_column',
      name: '',
      minWidth: props.tree ? width : undefined,
      width: props.tree ? undefined : width,
      align: props.tree ? 'left' : 'center',
      fixed: 'left',
      nameRender() {
        const checkboxNode = createVNode(UCheckbox, {
          modelValue: allChecked.value,
          'onUpdate:modelValue': handleCheckAll
        })
        if (!props.tree) {
          return checkboxNode
        }

        const expandNode = createVNode('i', {
          text: true,
          class: cls.e('expand-space')
        })
        return [expandNode, checkboxNode]
      },
      render(ctx) {
        const { row } = ctx
        return createVNode(UCheckbox, {
          class: checkboxClass,
          modelValue: row.checked,
          'onUpdate:modelValue': (val: boolean) => {
            handleCheckRow(row, val)
          },
          onClick: checkboxClick
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
    const width = getCheckboxColumnWidth()
    return {
      key: '__is_select_column',
      name: '单选',
      minWidth: props.tree ? width : undefined,
      width: props.tree ? undefined : width,
      align: props.tree ? 'left' : 'center',
      fixed: 'left',
      nameRender(ctx) {
        if (!props.tree) {
          return '单选'
        }

        const expandNode = createVNode('i', {
          text: true,
          class: cls.e('expand-space')
        })
        return [expandNode, createTextVNode('单选')]
      },

      render({ row }) {
        return createVNode(UCheckbox, {
          class: checkboxClass,
          modelValue: row.checked,
          'onUpdate:modelValue': (val: boolean) => {
            handleSelect(row, val)
          },
          onClick: checkboxClick
        })
      }
    }
  }

  return {
    createCheckColumn,
    createSelectColumn,
    clearChecked,
    clearSelected
  }
}
