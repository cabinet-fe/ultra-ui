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
      <u-card-header v-if="!!$slots.header || title">
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
        v-model:current-row="state.row"
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
        <div>
          <u-tip
            content="快速编辑可以能够增加编辑效率，但是不能保证数据的完整性，因为它允许未校验的数据通过"
          >
            <u-checkbox v-model="quickEdit">快速编辑</u-checkbox>
          </u-tip>
        </div>

        <u-button
          :icon="Plus"
          @click="handleCreate"
          text
          type="primary"
          :loading="state.loading"
        >
          新增
        </u-button>
      </u-card-action>
    </u-card>

    <u-card :class="cls.e('form')" v-if="state.visible && !!props.model">
      <u-card-header>
        <template v-if="readonly">详情</template>
        <template v-else-if="!!state.parentRow">新增子级</template>
        <template v-else-if="state.type === 'create'">新增</template>
        <template v-else-if="state.type === 'update'">编辑</template>
      </u-card-header>

      <transition name="fade" appear mode="out-in">
        <u-scroll always :class="cls.e('form-wrap')">
          <u-form
            :model="props.model"
            :readonly="readonly"
            @keyup.enter="handleSave"
            :label-width="labelWidth"
          >
            <template #default="{ data, model }">
              <slot
                name="form"
                v-bind="{
                  data,
                  model,
                  row: state.row
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
          :loading="state.loading"
          @click="handleClose"
        >
          关闭
        </u-button>
        <u-button
          v-if="!readonly && !quickEdit"
          :type="state.type === 'create' ? 'success' : 'primary'"
          :loading="state.loading"
          @click="handleSave"
        >
          确认{{ state.type === 'create' ? '新增' : '修改' }}
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
import { computed, inject, shallowRef, watch } from 'vue'
import { omit } from 'cat-kit/fe'
import { Plus, Delete, InsertToPrev, InsertToNext, AddChild } from 'icon-ultra'
import {
  UTable,
  type TableColumnSlotsScope,
  type TableExposed,
  type TableRow
} from '../table'
import { UCard, UCardAction, UCardHeader } from '../card'
import { type FormModel, UForm } from '../form'
import { ULayout } from '../layout'
import { UScroll } from '../scroll'
import { UCheckbox } from '../checkbox'
import { UTip } from '../tip'
import { UButton, type ButtonProps } from '../button'
import { bem } from '@ui/utils'
import { useComponentProps } from '@ui/compositions'
import { DialogDIKey } from '../dialog/di'
import { useEdit } from './use-edit'

defineOptions({
  name: 'BatchEdit'
})

const props = withDefaults(defineProps<BatchEditProps<Model>>(), {
  cols: () => ['1fr', '400px'],
  resizable: true,
  mode: 'normal'
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
      /** 当前编辑的行 */
      row?: TableRow
    }) => any

    header?: () => any
  } & Partial<{
    [key: `column:${string}`]: (props: TableColumnSlotsScope) => any
  }>
>()

const cls = bem('batch-edit')

const tableRef = shallowRef<TableExposed>()

const {
  state,
  quickEdit,
  insertIndexes,
  handleCreate,
  handleDelete,
  handleSave,
  handleInsertToNext,
  handleInsertToPrev,
  handleClose,
  handleInsertChild
} = useEdit({
  props,
  emit,
  tableRef
})

const dialogCtx = inject(DialogDIKey, undefined)

// 如果在dialog上下文中
dialogCtx &&
  watch(dialogCtx.visible, visible => {
    !visible && handleClose()
  })

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

const cols = computed(() => {
  return !!state.row || state.visible ? props.cols : undefined
})
</script>
