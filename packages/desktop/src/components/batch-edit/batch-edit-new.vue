<template>
  <u-table v-bind="tableProps" :columns="columnsWithOperation" :current="currentRow" :class="cls.b">
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
          <u-scroll :class="cls.e('form-scroll')" :content-class="cls.e('form-scroll-content')">
            <u-form :model="model!" :readonly="readonly" :label-width="labelWidth">
              <template #default="{ data, model }">
                <slot name="form" v-bind="{ data, model }" />
              </template>
            </u-form>
          </u-scroll>

          <div :class="cls.e('form-action')">
            <u-button @click="handleClose" type="primary" text> 关闭 </u-button>
            <u-button type="primary" @click="handleSubmit" v-if="!readonly"> 提交 </u-button>
          </div>
        </template>
      </u-tip>
    </template>
  </u-table>
</template>

<script lang="ts" setup>
import { o } from '@cat-kit/core'
import { useComponentProps } from '@ultra-ui/compositions'
import { AddChild, Copy, Delete, Edit, Plus, View } from '@ultra-ui/icons'
import { bem } from '@ultra-ui/utils'
import { computed, watch } from 'vue'

import type { BatchEditEmits, BatchEditProps, ButtonProps, TableColumn } from '../../types'
import { UButton } from '../button'
import { type FormModel, UForm } from '../form'
import { UScroll } from '../scroll'
import { UTable } from '../table'
import { UTip } from '../tip'
import { useEdit } from './use-edit-new'
import { useTip } from './use-tip'

defineOptions({
  name: 'BatchEdit'
})

const props = defineProps<BatchEditProps<FormModel>>()
const emit = defineEmits<BatchEditEmits>()

const tableProps = computed(() => {
  return o(props as Record<string, any>).omit([
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
    ['create', 'delete', 'update', 'copy', 'view']
    // props.features ?? ['create', 'delete', 'update', 'copy', 'view']
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

const { currentRow, handleEdit, handleAdd, handleCopy, handleDelete, handleView } = useEdit({
  emit,
  props,
  open
})

watch(currentRow, (r) => {
  visible.value = Boolean(r)
})

function handleClose() {
  currentRow.value = undefined
}
</script>
