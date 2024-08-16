<template>
  <u-card :class="cls.e('list')" integrate>
    <u-card-header v-if="!!slots.header || props.title">
      <slot> {{ props.title }} </slot>
    </u-card-header>
    <div :class="cls.e('tools')">
      <u-tip
        content="快速编辑可以能够增加编辑效率，但是不能保证数据的完整性，因为它允许未校验的数据通过"
        style="
          color: var(--color-info);
          background-color: var(--color-info-light-9);
          width: 200px;
        "
      >
        <u-checkbox v-model="quickEdit">快速编辑</u-checkbox>
      </u-tip>
    </div>

    <u-table
      v-bind="tableProps"
      :slots="slots"
      :class="cls.e('table')"
      :columns="columns"
      highlight-current
      v-model:current-row="state.row"
      ref="tableRef"
    >
      <template #column:__action__="{ row }">
        <ButtonWrap @click.stop :loading="row.operating">
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

          <u-button
            :icon="Delete"
            type="danger"
            title="删除"
            @click="handleDelete(row)"
          />
        </ButtonWrap>
      </template>

      <template #empty> {{ null }} </template>

      <template
        #append
        v-if="
          !props.readonly &&
          (quickEdit ||
            (state.type === 'create' && !state.visible) ||
            state.type === 'update')
        "
      >
        <div :class="cls.e('add')">
          <u-button
            plain
            type="primary"
            @click="handleCreate"
            :loading="state.loading"
          >
            <span
              style="position: sticky; left: 50%; transform: translateX(-50%)"
            >
              新增
            </span>
          </u-button>
        </div>
        <!-- <tr>
          <td :colspan="columns.length" :class="cls.e('add')">
            <u-button
              plain
              type="primary"
              @click="handleCreate"
              :loading="state.loading"
            >
              <span
                style="position: sticky; left: 50%; transform: translateX(-50%)"
              >
                新增
              </span>
            </u-button>
          </td>
        </tr> -->
      </template>
    </u-table>
  </u-card>
</template>

<script setup lang="ts">
import { computed, inject, type Slots } from 'vue'
import { omit } from 'cat-kit/fe'
import { Delete, InsertToPrev, InsertToNext, AddChild } from 'icon-ultra'
import { BatchEditDIKey } from './di'
import { useComponentProps } from '@ui/compositions'
import { UCard, UCardHeader } from '../card'
import { UTable } from '../table'
import { UCheckbox } from '../checkbox'
import { UButton } from '../button'
import { UTip } from '../tip'
import type { ButtonProps } from '../button'

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
  quickEdit,
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
    'saveMethod'
  ])
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

const ButtonWrap = useComponentProps<ButtonProps>({
  size: 'small',
  circle: true,
  text: true,
  type: 'primary',
  style: { fontSize: '16px', marginRight: '6px' },
  loading: false
})
</script>
