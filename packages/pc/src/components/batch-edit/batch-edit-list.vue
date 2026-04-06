<template>
  <u-table
    v-bind="tableProps"
    :slots="slots"
    :class="cls.e('table')"
    :columns="columns"
    highlight-current
    :current-row="state.row"
    @update:current="handleUpdateCurrentRow"
    @update:checked="emit('update:checked', $event)"
    @update:selected="emit('update:selected', $event)"
    ref="tableRef"
  >
    <template #column:__action__="{ row }">
      <u-action-group @click.stop :loading="row.operating" :max="9">
        <template
          v-if="staticFeatures.has('create') || dynamicFeatures.create?.(row)"
        >
          <u-action
            @run="handleInsertToPrev(row)"
            :icon="BetweenVerticalStart"
            title="插入到上一行"
            v-bind="props.actionsProps?.create"
          />
          <u-action
            @run="handleInsertToNext(row)"
            :icon="BetweenVerticalEnd"
            title="插入到下一行"
            v-bind="props.actionsProps?.create"
          />
        </template>

        <u-action
          v-if="
            props.tree &&
            (staticFeatures.has('createChild') ||
              dynamicFeatures.createChild?.(row))
          "
          @run="handleInsertChild(row)"
          :icon="CopyPlus"
          title="添加子项"
          v-bind="props.actionsProps?.createChild"
        />

        <u-action
          v-if="staticFeatures.has('delete') || dynamicFeatures.delete?.(row)"
          :icon="Trash2"
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
          plain
          type="primary"
          @click.stop="handleCreate"
          :loading="state.loading"
          text
          v-bind="props.actionsProps?.create"
        >
          <span
            style="position: sticky; left: 50%; transform: translateX(-50%)"
          >
            新增
          </span>
        </u-button>
      </div>
    </template>
  </u-table>
</template>

<script setup lang="ts">
import { computed, inject, type Slots } from 'vue'
import { o } from '@cat-kit/core'
import { BetweenVerticalEnd, BetweenVerticalStart, CopyPlus, Trash2 } from 'lucide-vue-next'
import { BatchEditDIKey } from './di'
import { UTable } from '../table'
import { UButton } from '../button'
import { UActionGroup, UAction } from '../action'
import type { BatchEditFeature, TableRow } from '@ultra-ui/pc/types'

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
  handleDelete,
  handleInsertToNext,
  handleInsertToPrev,
  handleInsertChild
} = inject(BatchEditDIKey)!

const tableProps = computed(() => {
  return o(props).omit([
    'model',
    'columns',
    'cols',
    'readonly',
    'deleteMethod',
    'saveMethod',
    'features'
  ])
})

const hasNot = (value: BatchEditFeature[]) =>
  value.every(v => !staticFeatures.value.has(v))

const columns = computed(() => {
  if (props.readonly || hasNot(['create', 'delete', 'createChild']))
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
  if (
    staticFeatures.value.has('update') ||
    dynamicFeatures.value.update?.(row)
  ) {
    state.row = row
    state.depth = row?.depth
  }
}
</script>
