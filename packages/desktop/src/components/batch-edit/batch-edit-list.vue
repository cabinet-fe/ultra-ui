<template>
  <u-table
    v-bind="tableProps"
    :slots="slots"
    :class="[cls.e('table')]"
    :columns="columns"
    highlight-current
    :current="state.row"
    @update:current="handleUpdateCurrentRow"
    @update:checked="emit('update:checked', $event)"
    @update:selected="emit('update:selected', $event)"
  >
    <template #column:__action__="{ row }">
      <u-action-group :class="cls.e('row-actions')" :max="5" @click.stop circle>
        <u-action
          v-if="allowed('create', row)"
          :icon="InsertToPrev"
          title="在上方插入"
          @run="handleInsertToPrev(row)"
        />
        <u-action
          v-if="allowed('create', row)"
          :icon="InsertToNext"
          title="在下方插入"
          @run="handleInsertToNext(row)"
        />
        <u-action
          v-if="!!props.tree && allowed('createChild', row)"
          :icon="AddChild"
          title="添加子级"
          @run="handleInsertChild(row)"
        />
        <u-action
          v-if="canDelete(row)"
          :icon="Delete"
          type="danger"
          title="删除"
          @run="handleDelete(row)"
          v-bind="props.actionsProps?.delete"
        />
      </u-action-group>
    </template>

    <!-- 新增按钮 -->
    <template #append v-if="showCreateBtn">
      <div :class="cls.e('add')">
        <u-button
          :class="cls.e('add-btn')"
          :icon="Plus"
          :loading="state.loading"
          type="primary"
          plain
          @click.stop="handleCreate"
        >
          新增一行
        </u-button>
      </div>
    </template>
  </u-table>
</template>

<script setup lang="ts">
import { o } from '@cat-kit/core'
import { AddChild, Delete, InsertToNext, InsertToPrev, Plus } from '@veltra/icons/normal'
import { computed, inject, type Slots } from 'vue'

import type { BatchEditFeature, TableRow } from '../../types'
import { UAction, UActionGroup } from '../action'
import { UButton } from '../button'
import { UTable } from '../table'
import { BatchEditDIKey } from './di'

defineOptions({ name: 'BatchEditList' })

defineProps<{ slots: Slots }>()

const {
  cls,
  state,
  props,
  emit,
  staticFeatures,
  dynamicFeatures,
  handleCreate,
  handleDelete,
  handleInsertToNext,
  handleInsertToPrev,
  handleInsertChild
} = inject(BatchEditDIKey)!

const tableProps = computed(() => {
  return o(props as Record<string, any>).omit([
    'model',
    'columns',
    'cols',
    'readonly',
    'deleteMethod',
    'saveMethod',
    'features',
    'mode',
    'beforeCreate'
  ])
})

const hasNot = (value: BatchEditFeature[]) => value.every((v) => !staticFeatures.value.has(v))

const allowed = (feature: BatchEditFeature, row?: TableRow) => {
  return staticFeatures.value.has(feature) || !!dynamicFeatures.value[feature]?.(row)
}

const columns = computed(() => {
  if (props.readonly || hasNot(['create', 'delete', 'createChild', 'update'])) return props.columns

  return (props.columns ?? []).concat({
    name: '操作',
    key: '__action__',
    align: 'center',
    width: 180,
    fixed: 'right',
    resizable: false
  })
})

function handleUpdateCurrentRow(row?: TableRow) {
  if (allowed('update', row)) {
    state.row = row
  }
}

function canDelete(row: TableRow) {
  return !props.readonly && allowed('delete', row)
}

const showCreateBtn = computed(() => {
  if (props.readonly) return false

  const hasFeature = staticFeatures.value.has('create') || dynamicFeatures.value.create?.()
  const createActionVisible = state.formActionType === 'create' && state.formVisible
  return hasFeature && !createActionVisible
})
</script>
