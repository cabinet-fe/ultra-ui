<template>
  <u-table
    v-bind="tableProps"
    :slots="slots"
    :class="[cls.e('table'), bem.is('editing', state.visible)]"
    :columns="columns"
    highlight-current
    :current="state.row"
    @update:current="handleUpdateCurrentRow"
    @update:checked="emit('update:checked', $event)"
    @update:selected="emit('update:selected', $event)"
    ref="tableRef"
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
          v-if="allowed('copy', row)"
          :icon="Copy"
          title="复制此行"
          @run="handleCopy(row)"
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

    <template #empty v-if="!props.readonly"> {{ null }} </template>

    <template
      #append
      v-if="
        !props.readonly &&
        (staticFeatures.has('create') || dynamicFeatures.create?.()) &&
        ((state.type === 'create' && !state.visible) || state.type === 'update')
      "
    >
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
import { AddChild, Copy, Delete, InsertToNext, InsertToPrev, Plus } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
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
  tableRef,
  props,
  emit,
  staticFeatures,
  dynamicFeatures,
  handleCreate,
  handleCopy,
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
    'features'
  ])
})

const hasNot = (value: BatchEditFeature[]) => value.every((v) => !staticFeatures.value.has(v))

const allowed = (feature: BatchEditFeature, row?: TableRow) => {
  return staticFeatures.value.has(feature) || !!dynamicFeatures.value[feature]?.(row)
}

const columns = computed(() => {
  if (props.readonly || hasNot(['create', 'delete', 'createChild', 'update', 'copy']))
    return props.columns

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
    state.depth = row?.depth
  }
}

function canDelete(row: TableRow) {
  return !props.readonly && allowed('delete', row)
}
</script>
