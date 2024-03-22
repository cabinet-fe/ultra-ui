<template>
  <tbody :class="cls.e('tbody')">
    {{
      rows
    }}
    <row-form-body-item
      v-for="row in rows"
      :row="row"
      @click="handleClick"
      @contextmenu="handleDblClick"
      @delete="(_, index) => handleDeleteData(index)"
      @insert="(_, index) => handleDeleteInsertData(index)"
    >
    </row-form-body-item>

    <Teleport to="body">
      <div
        v-if="visible"
        ref="operationRef"
        :style="`left: ${x}px; top: ${y}px`"
        :class="cls.e('context-info')"
      >
        <div
          v-for="(item, index) of operationArray"
          :class="cls.em('context-info', 'operation')"
          @click="handleOperationData(item, index)"
        >
          {{ item['name'] }}
        </div>
      </div>
    </Teleport>
  </tbody>
</template>
<script lang="ts" setup>
import { inject, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { RowFormInjectType } from './di'
import type {
  RowFormColumn,
  RowFormOperation
} from '@ui/types/components/row-form'
import RowFormBodyItem from './row-form-body-item.vue'
import { wrapDataRows } from './row-forms'

const operationArray: RowFormOperation[] = [
  { key: 'delete', name: '删除当前条' },
  { key: 'insert', name: '向下插入' }
]

const injected = inject(RowFormInjectType)!

let { rows, cls, emits } = injected

/** 操作栏信息的ref */
const operationRef = shallowRef<InstanceType<typeof HTMLDivElement>>()
/** 操作栏信息 */
let visible = ref(false)

/** 失去焦点后rows的下表 */
let currentDataIndex: number = 0
/** 失去焦点后当前rows的数据 */
let currentDataItem: Record<string, any> = {}
/** 失去焦点后columns当前的数据 */
let currentColumnsItem: RowFormColumn

/** 获取右键信息位置 */
let x = ref(0)
let y = ref(0)

/** 右击事件 */
const handleDblClick = (event: MouseEvent, index: number) => {
  x.value = event.x
  y.value = event.y

  dbIndex.value = index

  visible.value = true
}

/**
 * 点击事件
 * @param event
 * @param rows的下标
 * @param rows的数据
 * @param columns的数据
 */
const handleClick = (
  event: Event,
  dataIndex: number,
  dataItem: Record<string, any>,
  columnsItem: RowFormColumn
) => {
  currentDataIndex = dataIndex
  currentDataItem = dataItem
  currentColumnsItem = columnsItem

  event.target?.addEventListener('blur', blurEventHandler)
}

/** 处理blur事件的函数 */
const blurEventHandler = (event: Event) => {
  if (rows.value.length - 1 !== currentDataIndex) return

  if (!currentDataItem[currentColumnsItem.key]) return

  // console.log(rows.value)
  // rows.value = wrapDataRows([props.modelValue, {}])

  // let a = rows.value.map((item: any) => {
  //   return item.data
  // })
  // emits('update:modelValue', a)

  /** 结束时候清除事件 */
  event.target?.removeEventListener('blur', blurEventHandler)
}

/** 右键事件的下标 */
let dbIndex = ref(0)

/** 操作栏 */
const handleOperationData = (item: Record<string, any>, index: number) => {
  if (item['key'] === 'delete') {
    handleDeleteData(dbIndex.value)
  } else if (item['key'] === 'insert') {
    handleDeleteInsertData(index)
  }
}

/** 删除 */
const handleDeleteData = (index: number) => {
  // rows.value = deleteIndex(rows.value, index)
}

/** 插入 */
const handleDeleteInsertData = (index: number) => {
  // rows.value = wrapDataRows(insetTo(rows.value, index))
}

/** 监听操作栏，点击除操作栏的任何位置隐藏操作栏 */
const watchOperationViable = (e: Event) => {
  if (e.target !== operationRef.value) {
    visible.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', watchOperationViable)
})
onUnmounted(() => {
  document.removeEventListener('click', watchOperationViable)
})
</script>
