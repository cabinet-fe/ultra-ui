<template>
  <u-table
    v-bind="tableProps"
    :columns="columnsWithOperation"
    :current="currentRow"
    :class="cls.b"
  >
    <template #column:__action__="{ row }">
      <ButtonWrap tag="div" @click.stop>
        <u-button
          :icon="View"
          title="查看"
          v-if="featureSets.has('view')"
          @click="handleView(row, $event)"
        />
        <u-button
          :icon="Edit"
          title="编辑"
          v-if="featureSets.has('update')"
          @click="handleEdit(row, $event)"
        />
        <u-button
          :icon="Plus"
          title="下方新增"
          v-if="featureSets.has('create')"
          @click="handleAdd(row, $event)"
        />
        <u-button
          :icon="AddChild"
          title="新增子项"
          v-if="featureSets.has('create') && !!tree"
          @click="handleAdd(row, $event)"
        />
        <u-button
          :icon="Copy"
          title="复制"
          v-if="featureSets.has('copy')"
          @click="handleCopy(row, $event)"
        />
        <u-button
          :icon="Delete"
          type="danger"
          title="删除"
          v-if="featureSets.has('delete')"
          @click="handleDelete(row)"
        />
      </ButtonWrap>
    </template>

    <template #append>
      <u-tip
        :visible="visible && !!model"
        :trigger-dom="triggerDom"
        trigger="click"
        alignment="center"
        direction="left"
        :class="cls.e('tip')"
      >
        <template #content>
          <div :class="cls.e('form-title')" v-if="tipType">
            {{ titleDict[tipType] }}
          </div>
          <u-scroll
            :class="cls.e('form-scroll')"
            :content-class="cls.e('form-scroll-content')"
          >
            <u-form
              :model="model!"
              :readonly="readonly"
              :label-width="labelWidth"
            >
              <template #default="{ data, model }">
                <slot name="form" v-bind="{ data, model }" />
              </template>
            </u-form>
          </u-scroll>

          <div :class="cls.e('form-action')">
            <u-button @click="handleClose" type="primary" text> 关闭 </u-button>
            <u-button type="primary" @click="handleSubmit" v-if="!readonly">
              提交
            </u-button>
          </div>
        </template>
      </u-tip>
    </template>
  </u-table>
</template>

<script lang="ts" setup>
import type {
  BatchEditEmits,
  BatchEditProps,
  ButtonProps,
  TableColumn
} from '@ui/types'
import { type FormModel, UForm } from '../form'
import { UTable } from '../table'
import { UScroll } from '../scroll'
import { UTip } from '../tip'
import { computed, watch } from 'vue'
import { UButton } from '../button'
import { Copy, Edit, Delete, Plus, AddChild, View } from '@ultra/icon'
import { useComponentProps } from '@ui/compositions'
import { bem } from '@ui/utils'
import { useEdit } from './use-edit-new'
import { useTip } from './use-tip'
import { omit } from 'cat-kit/fe'

defineOptions({
  name: 'BatchEdit'
})

const props = defineProps<BatchEditProps<FormModel>>()
const emit = defineEmits<BatchEditEmits>()

const tableProps = computed(() => {
  return omit(props, [
    'model',
    'columns',
    'cols',
    'readonly',
    'deleteMethod',
    'saveMethod',
    'features',
    'current'
  ])
})

const featureSets = computed(() => {
  return new Set(
    props.features ?? ['create', 'delete', 'update', 'copy', 'view']
  )
})

const cls = bem('batch-edit')

const columnsWithOperation = computed<TableColumn[]>(() => {
  return [
    ...(props.columns ?? []),
    {
      name: '操作',
      key: '__action__',
      align: 'center',
      fixed: 'right',
      width: 196,
      resizable: false
    }
  ]
})

const ButtonWrap = useComponentProps<ButtonProps>({
  size: 'small',
  circle: true,
  text: true,
  type: 'primary',
  style: { fontSize: '16px', marginRight: '6px' },
  loading: false
})

const { visible, triggerDom, tipType, open, handleSubmit } = useTip({
  props
})

const titleDict = {
  create: '新增',
  update: '编辑',
  copy: '复制',
  view: '查看'
}

const {
  currentRow,
  handleEdit,
  handleAdd,
  handleCopy,
  handleDelete,
  handleView
} = useEdit({
  emit,
  props,
  open
})

watch(currentRow, r => {
  visible.value = !!r ? true : false
})

function handleClose() {
  currentRow.value = undefined
}
</script>
