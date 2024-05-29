<template>
  <u-layout
    :class="cls.b"
    :cols="cols"
    rows="100%"
    gap="8px"
    :resizable="resizable"
  >
    <u-card :class="cls.e('list')">
      <u-card-header v-if="slots.header || title">
        <slot name="header">
          {{ title }}
        </slot>
      </u-card-header>
      <u-table
        :checkable="!readonly"
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
        <u-button
          type="danger"
          :icon="Delete"
          :disabled="!checked.length"
          :loading="actionLoading"
          @click="handleDeleteBatch"
        >
          删除
        </u-button>
        <u-button
          type="primary"
          :icon="Plus"
          @click="handleAppend"
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
            <template #default="scoped">
              <!-- @vue-ignore -->
              <slot name="form" v-bind="scoped" />
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
          type="primary"
          :loading="actionLoading"
          @click="handleSave"
        >
          保存
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
import { computed, nextTick, shallowRef, watch } from 'vue'
import { last, omit, omitArr } from 'cat-kit/fe'
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
    }) => any

    header?: () => any
  } & {
    [key: `column:${string}`]: (props: TableColumnSlotsScope) => any
  }
>()

const cls = bem('batch-edit')

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
const newRow = shallowRef(false)
let newRowIndexes: number[] = []
let parentData: Record<string, any> | undefined
/** 是否切换中，用来触发过渡效果 */
const toggling = shallowRef(false)

watch(currentRow, row => {
  if (row) {
    newRow.value = false
    newRowIndexes = []
  }
})

const cols = computed(() => {
  return !!currentRow.value || newRow.value ? props.cols : undefined
})

/** 重新渲染 */
function rerender() {
  toggling.value = true
  nextTick(() => {
    toggling.value = false
  })
}

const checked = shallowRef<Record<string, any>[]>([])

function handleRowChange(row?: TableRow) {
  if (!props.model) return

  currentRow.value = row
  props.model.resetData()
  if (row) {
    props.model.setData(row.data)
  }
  rerender()
}

function runCreate(cb: () => void) {
  tableRef.value?.clearCurrentRow()
  newRow.value = true
  cb()
}

function handleAppend() {
  runCreate(() => {
    newRowIndexes = [props.data?.length ?? 0]
  })
}

function handleInsertToPrev(row: TableRow) {
  runCreate(() => {
    newRowIndexes = [...row.indexes]
  })
}

function handleInsertToNext(row: TableRow) {
  runCreate(() => {
    newRowIndexes = [...row.indexes.slice(0, -1), row.index + 1]
  })
}

function handleInsertChild(row: TableRow) {
  parentData = row.data
  runCreate(() => {
    if (row.children?.length) {
      newRowIndexes = [...row.indexes, row.children.length]
    } else {
      newRowIndexes = [...row.indexes, 0]
    }
  })
}

function insert(item: Record<string, any>) {
  const data = [...(props.data ?? [])]

  if (!newRowIndexes.length) return

  let arr = data
  let parent: undefined | Record<string, any>
  const childrenKey = typeof props.tree === 'string' ? props.tree : 'children'
  newRowIndexes.slice(0, -1).forEach(i => {
    parent = arr[i]!
    arr = parent[childrenKey]
  })

  if (arr) {
    let i = last(newRowIndexes)
    arr.splice(i, 0, item)
  } else if (parent) {
    parent[childrenKey] = [item]
  }

  emit('update:data', data)
}

function handleClose() {
  newRow.value = false
  newRowIndexes = []
  tableRef.value?.clearCurrentRow()
}

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

  const data = [...props.data!]
  let len = row.indexes.length - 1
  const childrenKey = typeof props.tree === 'string' ? props.tree : 'children'
  if (len < 0) {
    len = 0
  }
  let cur = data
  for (let i = 0; i < len; i++) {
    cur = cur[row.indexes[i]!]![childrenKey]
  }
  cur.splice(row.index, 1)

  emit('update:data', omitArr(props.data!, row.index))
}

async function handleDeleteBatch() {
  // const { deleteMethod } = props
}

const actionLoading = shallowRef(false)
async function handleSave() {
  const { saveMethod } = props

  if (!props.model) return

  props.model.clearValidate()
  const valid = await props.model.validate()

  if (!valid) return

  let saveResult: any
  if (saveMethod) {
    if (currentRow.value) {
      currentRow.value.operating = true
    }
    actionLoading.value = true

    try {
      saveResult = await saveMethod(
        props.model.data,
        newRow.value ? 'create' : 'update',
        parentData
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
    const data = saveResult ?? { ...props.model.data }
    insert(data)
    parentData = undefined
    await nextTick()
    tableRef.value?.setCurrentRow(data)
    await nextTick()
  }
  // 更新提交
  else {
    if (!currentRow.value) return
    Object.assign(currentRow.value.data, props.model.data)
  }

  const currentRowEl = tableRef.value?.el?.querySelector('tbody tr.is-current')

  if (currentRowEl) {
    currentRowEl.scrollIntoView({ block: 'nearest' })
    const blinkCls = bem.is('blink')
    currentRowEl.classList.add(blinkCls)
    setTimeout(() => {
      currentRowEl?.classList.remove(blinkCls)
    }, 500)
  }
}
</script>
