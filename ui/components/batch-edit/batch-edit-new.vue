<template>
  <u-table
    :columns="columnsWithOperation"
    :data="data"
    :current-row="currentRow"
    :class="cls.b"
    checkable
  >
    <template #column:__action__="{ row }">
      <ButtonWrap tag="div" @click.stop>
        <u-button :icon="Edit" title="编辑" @click="handleEdit(row, $event)" />
        <u-button :icon="Plus" title="新增" @click="handleAdd(row, $event)" />
        <u-button
          :icon="AddChild"
          title="新增子项"
          @click="handleAdd(row, $event)"
        />
        <u-button :icon="Copy" title="复制" @click="handleCopy(row, $event)" />
        <u-button
          :icon="Delete"
          type="danger"
          title="删除"
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
              :cols="3"
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
import { Copy, Edit, Delete, Plus, AddChild } from 'icon-ultra'
import { useComponentProps } from '@ui/compositions'
import { bem } from '@ui/utils'
import { useEdit } from './use-edit-new'
import { useTip } from './use-tip'

defineOptions({
  name: 'BatchEdit'
})

const props = defineProps<BatchEditProps<FormModel>>()
const emit = defineEmits<BatchEditEmits>()

const cls = bem('batch-edit')

const columnsWithOperation = computed<TableColumn[]>(() => {
  return [
    ...(props.columns ?? []),
    {
      name: '操作',
      key: '__action__',
      align: 'center',
      fixed: 'right',
      width: 180,
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

const { visible, triggerDom, tipType, open, close, handleSubmit } = useTip({
  props
})

const titleDict = {
  create: '新增',
  update: '编辑',
  copy: '复制'
}

const { currentRow, handleEdit, handleAdd, handleCopy, handleDelete } = useEdit(
  {
    emit,
    props
  }
)

watch(currentRow, r => {
  visible.value = !!r ? true : false
})

function handleClose() {
  currentRow.value = undefined
}
</script>
