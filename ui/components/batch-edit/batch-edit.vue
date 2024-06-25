<template>
  <u-layout
    :class="cls.b"
    :cols="cols"
    rows="100%"
    gap="8px"
    :resizable="resizable"
    @keyup.esc="handleClose"
  >
    <u-card :class="cls.e('list')">
      <u-card-header v-if="slots.header || title">
        <slot name="header">
          {{ title }}
        </slot>
      </u-card-header>
      <u-table
        v-bind="tableProps"
        :slots="$slots"
        :class="cls.e('table')"
        :columns="columns"
        highlight-current
        @current-row-change="handleRowChange"
        v-model:checked="checked"
        ref="tableRef"
      >
        <template #column:__action__="{ row }">
          <ButtonWrap tag="span" @click.stop :loading="row.operating">
            <u-button
              @click="handleInsertToPrev(row)"
              :icon="InsertToPrev"
              title="插入到上一行"
            />
            <u-button
              @click="handleInsertToNext(row)"
              :icon="InsertToNext"
              title="插入到下一行"
            />

            <u-button
              v-if="tree"
              @click="handleInsertChild(row)"
              :icon="AddChild"
              title="添加子项"
            />

            <u-button
              :icon="Delete"
              type="danger"
              title="删除"
              @click="handleDelete(row)"
            />
          </ButtonWrap>
        </template>
      </u-table>

      <u-card-action :class="cls.e('action')" v-if="!readonly">
        <!-- <u-button
          type="danger"
          :icon="Delete"
          size="small"
          :disabled="!checked.length"
          :loading="actionLoading"
          @click="handleDeleteBatch"
        >
          删除
        </u-button> -->
        <u-button
          :icon="Plus"
          @click="handleAppend"
          text
          type="primary"
          :loading="actionLoading"
        >
          新增
        </u-button>
      </u-card-action>
    </u-card>

    <u-card
      :class="cls.e('form')"
      v-if="(currentRow || newRow) && !!props.model"
    >
      <u-card-header>
        <template v-if="newRow">新增</template>
        <template v-else-if="readonly">详情</template>
        <template v-else>编辑</template>
      </u-card-header>

      <transition name="fade" appear mode="out-in">
        <u-scroll v-if="model && !toggling" always :class="cls.e('form-wrap')">
          <u-form
            :model="props.model"
            :readonly="readonly"
            @keyup.enter="handleSave"
          >
            <template #default="{ data, model }">
              <!-- @vue-ignore -->
              <slot
                name="form"
                v-bind="{
                  data,
                  model,
                  indexes: currentRow?.indexes ?? newRowIndexes,
                  index: currentRow?.index ?? last(newRowIndexes)
                }"
              />
            </template>
          </u-form>
        </u-scroll>
      </transition>

      <u-card-action :class="cls.e('action')">
        <u-button
          text
          type="primary"
          :loading="actionLoading"
          @click="handleClose"
        >
          关闭
        </u-button>
        <u-button
          v-if="!readonly"
          :type="newRow ? 'success' : 'primary'"
          :loading="actionLoading"
          @click="handleSave"
        >
          提交{{ newRow ? '新增' : '修改' }}
        </u-button>
      </u-card-action>
    </u-card>
  </u-layout>
</template>

<script lang="ts" setup generic="Model extends FormModel">
import type {
  BatchEditEmits,
  BatchEditProps
} from '@ui/types/components/batch-edit'
import { computed, inject, nextTick, shallowRef, watch } from 'vue'
import { getChainValue, last, omit, safeRun, setChainValue } from 'cat-kit/fe'
import { Plus, Delete, InsertToPrev, InsertToNext, AddChild } from 'icon-ultra'
import {
  UTable,
  type TableColumnSlotsScope,
  type TableExposed,
  type TableRow
} from '../table'
import { UCard, UCardAction, UCardHeader } from '../card'
import { UForm, FormModel } from '../form'
import { ULayout } from '../layout'
import { UScroll } from '../scroll'
import { UButton, type ButtonProps } from '../button'
import { bem } from '@ui/utils'
import { useComponentProps } from '@ui/compositions'
import { DialogDIKey } from '../dialog/di'

defineOptions({
  name: 'BatchEdit'
})

const props = withDefaults(defineProps<BatchEditProps<Model>>(), {
  cols: () => ['1fr', '400px'],
  resizable: true
})

const emit = defineEmits<BatchEditEmits>()

const tableProps = computed(() => {
  return omit(props, [
    'model',
    'columns',
    'cols',
    'readonly',
    'deleteMethod',
    'saveMethod'
  ])
})

const slots = defineSlots<
  {
    form?: (props: {
      /** 表单数据 */
      data: Model['data']
      /** 表单模型 */
      model: Model
      /** 当前行索引 */
      index: number
      /** 树形索引 */
      indexes: number[]
    }) => any

    header?: () => any
  } & {
    [key: `column:${string}`]: (props: TableColumnSlotsScope) => any
  }
>()

const cls = bem('batch-edit')

const dialogCtx = inject(DialogDIKey, undefined)

// 如果在dialog上下文中
if (dialogCtx) {
  watch(dialogCtx.visible, visible => {
    if (!visible) {
      handleClose()
    }
  })
}

const tableRef = shallowRef<TableExposed>()

const ButtonWrap = useComponentProps<ButtonProps>({
  size: 'small',
  circle: true,
  text: true,
  type: 'primary',
  style: { fontSize: '16px' },
  loading: false
})

const columns = computed(() => {
  if (props.readonly) return props.columns
  return (props.columns ?? []).concat({
    name: '操作',
    key: '__action__',
    align: 'center',
    width: 150,
    fixed: 'right'
  })
})

const currentRow = shallowRef<TableRow>()

/**
 * 是否为新增行
 * 当row值变更
 */
const newRow = shallowRef(false)
const newRowIndexes = shallowRef<number[]>([])
let parentRow: TableRow | undefined
/** 是否切换中，用来触发过渡效果 */
const toggling = shallowRef(false)

/** 重新渲染 */
function rerender() {
  toggling.value = true
  nextTick(() => {
    toggling.value = false
  })
}

watch(newRow, () => {
  props.model?.resetData()
})

watch(currentRow, row => {
  props.model?.resetData()
  if (row) {
    newRow.value = false
    newRowIndexes.value = []
    props.model?.setData(row.data)
  }
  rerender()
})

const cols = computed(() => {
  return !!currentRow.value || newRow.value ? props.cols : undefined
})

const checked = shallowRef<Record<string, any>[]>([])

function handleRowChange(row?: TableRow) {
  const { model } = props
  if (!model) return
  currentRow.value = row
}

function runCreate(cb: () => void) {
  tableRef.value?.clearCurrentRow()
  newRow.value = true
  parentRow = undefined
  cb()
}

function handleAppend() {
  runCreate(() => {
    newRowIndexes.value = [props.data?.length ?? 0]
  })
}

function handleInsertToPrev(row: TableRow) {
  runCreate(() => {
    newRowIndexes.value = [...row.indexes]
  })
}

function handleInsertToNext(row: TableRow) {
  runCreate(() => {
    newRowIndexes.value = [...row.indexes.slice(0, -1), row.index + 1]
  })
}

function handleInsertChild(row: TableRow) {
  runCreate(() => {
    if (row.children?.length) {
      newRowIndexes.value = [...row.indexes, row.children.length]
    } else {
      newRowIndexes.value = [...row.indexes, 0]
    }
  })
  parentRow = row
}

function insert(item: Record<string, any>) {
  const data = [...(props.data ?? [])]

  if (!newRowIndexes.value.length) return

  let arr = data
  let parent: undefined | Record<string, any>
  const childrenKey = typeof props.tree === 'string' ? props.tree : 'children'
  newRowIndexes.value.slice(0, -1).forEach(i => {
    parent = arr[i]!
    arr = parent[childrenKey]
  })

  if (arr) {
    let i = last(newRowIndexes.value)
    arr.splice(i, 0, item)
    newRowIndexes.value[newRowIndexes.value.length - 1] = i + 1
  } else if (parent) {
    parent[childrenKey] = [item]
  }

  emit('update:data', data)
}

function handleClose() {
  newRow.value = false
  newRowIndexes.value = []
  parentRow = undefined
  tableRef.value?.clearCurrentRow()
}

/**
 * 删除
 * @param row 要删除的行
 */
async function handleDelete(row: TableRow) {
  const { deleteMethod } = props

  if (deleteMethod) {
    row.operating = true
    try {
      await deleteMethod(row ? [row.data] : checked.value)
    } finally {
      row.operating = false
    }
  }
  if (currentRow.value === row) {
    tableRef.value?.clearCurrentRow()
  }

  if (row === parentRow) {
    handleClose()
  }

  const data = [...props.data!]
  let len = row.indexes.length - 1
  const childrenKey = typeof props.tree === 'string' ? props.tree : 'children'
  if (len < 0) {
    len = 0
  }
  let arr = data

  for (let i = 0; i < len; i++) {
    arr = arr[row.indexes[i]!]![childrenKey]
  }

  arr.splice(row.index, 1)

  emit('update:data', data)
}

// async function handleDeleteBatch() {
//   const { deleteMethod } = props
// }

const actionLoading = shallowRef(false)
async function handleSave() {
  const { saveMethod, model } = props

  if (!model) return

  model.clearValidate()
  const valid = await model.validate()

  if (!valid) return

  let saveResult: any
  if (saveMethod) {
    if (currentRow.value) {
      currentRow.value.operating = true
    }
    actionLoading.value = true

    try {
      saveResult = await saveMethod(
        model.data,
        newRow.value ? 'create' : 'update',
        parentRow?.data
      )
    } finally {
      if (currentRow.value) {
        currentRow.value.operating = false
      }
      actionLoading.value = false
    }
  }

  // 新增提交
  if (newRow.value) {
    const data =
      saveResult ??
      safeRun(() => JSON.parse(JSON.stringify(model.data)), model.data)

    insert(data)
    if (parentRow) {
      parentRow.expanded = true
    }
    model.resetData()
  }
  // 更新提交
  else {
    if (!currentRow.value) return

    model.allKeys.forEach(key => {
      setChainValue(currentRow.value!.data, key, getChainValue(model.data, key))
    })

    const currentRowEl = tableRef.value?.el?.querySelector(
      'tbody tr.is-current'
    )

    if (currentRowEl) {
      currentRowEl.scrollIntoView({ block: 'nearest' })
      const blinkCls = bem.is('blink')
      currentRowEl.classList.add(blinkCls)
      setTimeout(() => {
        currentRowEl?.classList.remove(blinkCls)
      }, 500)
    }
  }
}
</script>
