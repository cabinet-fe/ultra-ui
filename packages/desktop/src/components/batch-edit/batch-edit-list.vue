<template>
  <u-table
    v-bind="tableProps"
    :slots="slots"
    :class="[cls.e('table'), bem.is('editing', state.visible)]"
    :columns="columns"
    highlight-current
    :current-row="state.row"
    @update:current="handleUpdateCurrentRow"
    @update:checked="emit('update:checked', $event)"
    @update:selected="emit('update:selected', $event)"
    ref="tableRef"
  >
    <template #column:__action__="{ row }">
      <u-action-group :class="cls.e('row-actions')" hover circle :max="3" @click.stop>
        <u-action
          v-if="canEdit(row)"
          :icon="props.readonly ? View : EditPen"
          :title="props.readonly ? '查看' : '编辑'"
          @run="handleEdit(row)"
          v-bind="props.actionsProps?.update"
        />

        <u-action
          v-if="canDelete(row)"
          :icon="Delete"
          type="danger"
          title="删除"
          @run="handleDelete(row)"
          v-bind="props.actionsProps?.delete"
        />

        <u-action v-if="allowed('create', row)" in-dropdown @run="handleInsertToPrev(row)">
          在上方插入
        </u-action>
        <u-action v-if="allowed('create', row)" in-dropdown @run="handleInsertToNext(row)">
          在下方插入
        </u-action>
        <u-action
          v-if="!!props.tree && allowed('createChild', row)"
          in-dropdown
          @run="handleInsertChild(row)"
        >
          添加子级
        </u-action>
        <u-action v-if="allowed('copy', row)" in-dropdown @run="handleCopy(row)">
          复制此行
        </u-action>
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
        <button
          type="button"
          :class="[cls.e('add-btn'), bem.is('loading', state.loading)]"
          :disabled="state.loading"
          @click.stop="handleCreate"
        >
          <u-icon :class="cls.e('add-icon')">
            <Plus />
          </u-icon>
          <span :class="cls.e('add-label')">新增一行</span>
        </button>
      </div>
    </template>
  </u-table>
</template>

<script setup lang="ts">
import { o } from '@cat-kit/core'
import { Delete, EditPen, Plus, View } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, type Slots } from 'vue'

import type { BatchEditFeature, TableRow } from '../../types'
import { UAction, UActionGroup } from '../action'
import { UIcon } from '../icon'
import { UTable } from '../table'
import { BatchEditDIKey } from './di'

defineOptions({
  name: 'BatchEditList'
})

defineProps<{
  slots: Slots
}>()

const {
  cls,
  state,
  tableRef,
  props,
  emit,
  staticFeatures,
  dynamicFeatures,
  handleCreate,
  handleEdit,
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
    width: 132,
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

function canEdit(row: TableRow) {
  return !props.readonly ? allowed('update', row) : true
}

function canDelete(row: TableRow) {
  return !props.readonly && allowed('delete', row)
}
</script>
