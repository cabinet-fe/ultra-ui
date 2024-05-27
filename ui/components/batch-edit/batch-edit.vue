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
          <ButtonWrap tag="span" @click.stop :loading="row.operating">
            <u-button
              @click="row.addToNext({})"
              :icon="InsertToPrev"
              title="插入到上一行"
            />
            <u-button
              @click="row.addToPrev({})"
              :icon="InsertToNext"
              title="插入到下一行"
            />
            <u-button :icon="Delete" title="删除" @click="handleDelete(row)" />
          </ButtonWrap>
        </template>
      </u-table>

      <u-card-action :class="cls.e('action')" v-if="!readonly">
        <u-button
          type="danger"
          :icon="Delete"
          :disabled="!checked.length"
          @click="handleDeleteBatch"
        >
          删除
        </u-button>
        <u-button type="primary" :icon="Plus" @click="handleCreate">
          新增
        </u-button>
      </u-card-action>
    </u-card>

    <u-card :class="cls.e('form')" v-if="(currentRow || newRow) && model">
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
        <u-button v-if="!readonly" type="primary" @click="handleSave">
          保存
        </u-button>
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
import { omit, omitArr } from 'cat-kit/fe'
import { Plus, Delete, InsertToPrev, InsertToNext } from 'icon-ultra'
import {
  UTable,
  type TableColumnSlotsScope,
  type TableExposed,
  type TableRow
} from '../table'
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
    }) => any

    header?: () => any
  } & {
    [key: `column:${string}`]: (props: TableColumnSlotsScope) => any
  }
>()

const cls = bem('batch-edit')

const tableRef = shallowRef<TableExposed>()

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
}

function handleClose() {
  tableRef.value?.clearCurrentRow()
}

async function handleDelete(row: TableRow) {
  const { deleteMethod } = props

  if (deleteMethod) {
    row.operating = true
    await deleteMethod(row ? [row.value] : checked.value)
    row.operating = false
  }
  if (currentRow.value === row) {
    tableRef.value?.clearCurrentRow()
  }
  emit('update:data', omitArr(props.data!, row.index))
}

async function handleDeleteBatch() {
  const { deleteMethod } = props
}

async function handleSave() {
  const { model, saveMethod } = props

  if (!model) return

  model.clearValidate()
  const valid = await model?.validate()

  if (!valid || !currentRow.value) return

  if (saveMethod) {
    await saveMethod(model.data)
  }

  // 新增提交
  if (newRow.value) {
    emit('update:data', [...props.data!, { ...model.data }])
  }
  // 更新提交
  else {
    Object.assign(currentRow.value.value, model.data)

    const currentRowEl = tableRef.value?.el?.querySelector(
      'tr.is-current'
    ) as HTMLElement | null

    if (currentRowEl) {
      const blinkCls = bem.is('blink')
      currentRowEl.classList.add(blinkCls)
      setTimeout(() => {
        currentRowEl?.classList.remove(blinkCls)
      }, 500)
    }
  }
}
</script>
