<template>
  <u-table
    v-bind="tableProps"
    :slots="slots"
    :class="cls.e('table')"
    :columns="columns"
    highlight-current
    :current-row="state.row"
    @update:current-row="handleUpdateCurrentRow"
    @update:checked="emit('update:checked', $event)"
    @update:selected="emit('update:selected', $event)"
    ref="tableRef"
  >
    <template #column:__action__="{ row }">
      <ButtonWrap tag="div" @click.stop :loading="row.operating">
        <template v-if="featureSets.has('create')">
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
            v-if="props.tree"
            @click="handleInsertChild(row)"
            :icon="AddChild"
            title="添加子项"
          />
        </template>

        <u-button
          v-if="featureSets.has('delete')"
          :icon="Delete"
          type="danger"
          title="删除"
          @click="handleDelete(row)"
        />
      </ButtonWrap>
    </template>

    <template #empty v-if="!props.readonly"> {{ null }} </template>

    <template
      #append
      v-if="
        !props.readonly &&
        featureSets.has('create') &&
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
import { omit } from 'cat-kit/fe'
import { Delete, InsertToPrev, InsertToNext, AddChild } from '@ultra/icon'
import { BatchEditDIKey } from './di'
import { useComponentProps } from '@ui/compositions'
import { UTable } from '../table'
import { UButton } from '../button'
import type { BatchEditFeature, ButtonProps, TableRow } from '@ui/types'

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
  featureSets,
  handleCreate,
  handleDelete,
  handleInsertToNext,
  handleInsertToPrev,
  handleInsertChild
} = inject(BatchEditDIKey)!

const tableProps = computed(() => {
  return omit(props, [
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
  value.every(v => !featureSets.value.has(v))

const columns = computed(() => {
  if (props.readonly || hasNot(['create', 'delete'])) return props.columns

  return (props.columns ?? []).concat({
    name: '操作',
    key: '__action__',
    align: 'center',
    width: 150,
    fixed: 'right',
    resizable: false
  })
})

const ButtonWrap = useComponentProps<ButtonProps>({
  size: 'small',
  circle: true,
  text: true,
  type: 'primary',
  style: { fontSize: '16px', marginRight: '6px' },
  loading: false
})

function handleUpdateCurrentRow(row?: TableRow) {
  if (featureSets.value.has('update')) {
    state.row = row
  }
}
</script>
