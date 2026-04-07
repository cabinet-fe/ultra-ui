<template>
  <u-table
    :columns="internalColumns"
    :data="modelValue || []"
    :class="cls.b"
    :stripe="false"
    show-index
    :slots="$slots"
  >
    <template #column:__operation="{ row }">
      <ButtonCommonProps
        tag="div"
        style="display: flex; justify-content: center; gap: 8px"
      >
        <u-button
          type="danger"
          @click="handleDelete(row.index)"
          :icon="Minus"
          title="移除"
        />
        <u-button
          :icon="Plus"
          @click="handleCreate(row.index)"
          title="新增到下一行"
        />
        <u-button :icon="Copy" @click="handleCopy(row)" title="复制到下一行" />
      </ButtonCommonProps>
    </template>

    <!-- <template #header:__operation> </template> -->

    <template #empty>
      <div style="text-align: center; padding: 4px 0">
        <u-button
          text
          size="small"
          type="primary"
          v-if="!modelValue.length"
          :icon="Plus"
          @click="handleCreate()"
          >添加</u-button
        >
      </div>
    </template>
  </u-table>
</template>

<script lang="ts" setup>
import type { TableEditorProps, TableEditorEmits, TableColumn } from '@ultra-ui/desktop/types'
import { bem } from '@ultra-ui/utils'
import { computed } from 'vue'
import { UTable } from '../table'
import { UButton } from '../button'
import { Plus, Minus, Copy } from '@ultra/icon'
import { useComponentProps } from '@ultra-ui/compositions'
import type { TableRowNode } from '../table/node/row'

defineOptions({
  name: 'TableEditor'
})

const { columns = [], modelValue = [] } = defineProps<TableEditorProps>()
const emit = defineEmits<TableEditorEmits>()

const cls = bem('table-editor')

const ButtonCommonProps = useComponentProps({
  size: 'small',
  circle: true,
  text: true,
  type: 'primary'
})

const actionColumn: TableColumn = {
  key: '__operation',
  name: '操作', // 使用name而不是title
  width: 120,
  align: 'center',
  fixed: 'right',
  resizable: false
}

// 内部列定义，添加编辑和删除操作列
const internalColumns = computed(() => {
  return [...columns, actionColumn]
})

function handleCreate(index?: number) {
  if (index !== undefined) {
    emit('update:modelValue', [
      ...modelValue.slice(0, index + 1),
      {},
      ...modelValue.slice(index + 1)
    ])
  } else {
    emit('update:modelValue', [...modelValue, {}])
  }
}

function handleCopy(row: TableRowNode) {
  emit('update:modelValue', [
    ...modelValue.slice(0, row.index + 1),
    JSON.parse(JSON.stringify(row.data)),
    ...modelValue.slice(row.index + 1)
  ])
}

function handleDelete(index: number) {
  emit(
    'update:modelValue',
    modelValue.filter((_, i) => i !== index)
  )
}
</script>
