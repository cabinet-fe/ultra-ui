<template>
  <u-layout
    :class="cls.b"
    :cols="cols"
    rows="100%"
    gap="8px"
    :resizable="resizable"
  >
    <u-card :class="cls.e('list')">
      <u-card-header v-if="slots.header || title">
        <slot name="header">
          {{ title }}
        </slot>
      </u-card-header>
      <u-table
        :checkable="!readonly"
        v-bind="tableProps"
        :slots="$slots"
        :class="cls.e('table')"
        :columns="columns"
        highlight-current
        @current-row-change="handleRowChange"
        v-model:checked="checked"
        ref="tableRef"
      >
        <template #column:__action__="{ row }">
          <ButtonWrap>
            <u-button @click.stop="row.addToNext({})" />
            <u-button @click.stop="row.addToPrev({})" />
            <u-button @click.stop="" :icon="Delete" title="删除" />
          </ButtonWrap>
        </template>
      </u-table>

      <u-card-action :class="cls.e('action')" v-if="!readonly">
        <u-button
          type="danger"
          :icon="Delete"
          :disabled="!checked.length"
          @click="handleDelete"
        >
          删除
        </u-button>
        <u-button type="primary" :icon="Plus" @click="handleCreate">
          新增
        </u-button>
      </u-card-action>
    </u-card>

    <u-card :class="cls.e('form')" v-if="currentRow || newRow">
      <u-card-header>
        <template v-if="newRow">新增</template>
        <template v-else-if="readonly">详情</template>
        <template v-else>编辑</template>
      </u-card-header>

      <transition name="fade" appear mode="out-in">
        <u-scroll
          v-if="props.model && !toggling"
          always
          :class="cls.e('form-wrap')"
        >
          <u-form
            :model="props.model"
            label-width="50px"
            :readonly="readonly"
            @keyup.enter="handleSave"
          >
            <template #default="scoped">
              <slot name="form" v-bind="scoped" />
            </template>
          </u-form>
        </u-scroll>
      </transition>

      <u-card-action :class="cls.e('action')">
        <u-button text type="primary" @click="handleClose">关闭</u-button>
        <u-button v-if="!readonly" type="primary" @click="handleSave"
          >保存</u-button
        >
      </u-card-action>
    </u-card>
  </u-layout>
</template>

<script lang="ts" setup generic="Model extends FormModel = FormModel">
import type {
  BatchEditEmits,
  BatchEditProps
} from '@ui/types/components/batch-edit'
import { computed, nextTick, shallowRef, watch } from 'vue'
import { omit } from 'cat-kit/fe'
import { Plus, Delete } from 'icon-ultra'
import { UTable, type TableExposed, type TableRow } from '../table'
import { UCard, UCardAction, UCardHeader } from '../card'
import { UForm, FormModel } from '../form'
import { ULayout } from '../layout'
import { UScroll } from '../scroll'
import { UButton, type ButtonProps } from '../button'
import { bem } from '@ui/utils'
import { useComponentProps } from '@ui/compositions'

defineOptions({
  name: 'BatchEdit'
})

const props = withDefaults(defineProps<BatchEditProps<Model>>(), {
  cols: () => ['1fr', '400px'],
  resizable: true
})

const emit = defineEmits<BatchEditEmits>()

const tableProps = computed(() => {
  return omit(props, ['model', 'columns', 'cols', 'readonly'])
})

const slots = defineSlots<{
  form?: (props: {
    /** 表单数据 */
    data: Model['data']
    /** 表单模型 */
    model: Model
  }) => any

  header?: () => any
}>()

const cls = bem('batch-edit')

const tableRef = shallowRef<TableExposed>()

const ButtonWrap = useComponentProps<ButtonProps>({
  size: 'small',
  circle: true,
  text: true,
  type: 'primary'
})

const columns = computed(() => {
  if (props.readonly) return props.columns
  return (props.columns ?? []).concat({
    name: '操作',
    key: '__action__',
    align: 'center'
  })
})

const currentRow = shallowRef<TableRow>()
const newRow = shallowRef(false)
/** 是否切换中，用来触发过渡效果 */
const toggling = shallowRef(false)

watch(currentRow, row => {
  if (row) {
    newRow.value = false
  }
})

const cols = computed(() => {
  return !!currentRow.value || newRow.value ? props.cols : undefined
})

/** 重新渲染 */
function rerender() {
  toggling.value = true
  nextTick(() => {
    toggling.value = false
  })
}

const checked = shallowRef<Record<string, any>[]>([])

function handleRowChange(row?: TableRow) {
  const { model } = props
  if (!model) return

  currentRow.value = row
  model.resetData()
  if (row) {
    model.setData(row.value)
  }
  rerender()
}

function handleCreate() {
  tableRef.value?.clearCurrentRow()
  newRow.value = true
  emit('update:data', [...(props.data ?? []), {}])
}

function handleClose() {
  tableRef.value?.clearCurrentRow()
}

function handleDelete() {}

async function handleSave() {
  const { model } = props

  model?.clearValidate()
  const valid = await model?.validate()

  if (!valid || !currentRow.value) return

  Object.assign(currentRow.value.value, props.model!.data)
}
</script>
