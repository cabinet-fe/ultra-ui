<template>
  <tbody :class="store.cls.e('tbody')">
    <!-- {{ store.slot }} -->
    <row-form-body-item
      @item-click="handleClick"
      :model-data="store.modelData.value"
      @contextmenu="handleDblClick"
      @delete="(_, index) => handleDeleteData(index)"
    >
      <template
        v-for="columnsItem of store.columns.value.filter(
          columnsItem => !!columnsItem.key
        )"
        :key="columnsItem.key"
        v-slot:[columnsItem.key]="data"
      >
        <slot
          v-if="useSlots()[columnsItem.key]"
          :name="columnsItem.key"
          v-bind="data"
        />

        <div v-else>{{ data['data']?.[columnsItem.key] }}</div>
      </template>
    </row-form-body-item>

    <Teleport to="body">
      <div
        v-if="visible"
        ref="operationRef"
        :style="`left: ${x}px; top: ${y}px`"
        :class="store.cls.e('context-info')"
      >
        <div
          v-for="(item, index) of operationArray"
          :class="store.cls.em('context-info', 'operation')"
          @click="handleOperationData(item, index)"
        >
          {{ item['name'] }}
        </div>
      </div>
    </Teleport>
  </tbody>
</template>
<script lang="ts" setup>
import {
  inject,
  onMounted,
  onUnmounted,
  ref,
  shallowReactive,
  shallowRef,
  useSlots,
  watch
} from 'vue'
import { RowFormStoreType } from './di'
import type {
  RowFormColumn,
  RowFormOperation
} from '@ui/types/components/row-form'
import RowFormBodyItem from './row-form-body-item.vue'
import { deleteIndex, wrapDataRows } from './row-forms'

let store = inject(RowFormStoreType)!

const operationArray: RowFormOperation[] = [
  { key: 'delete', name: '删除当前条' },
  { key: 'insert', name: '向下插入' }
]

/** 操作栏信息的ref */
const operationRef = shallowRef<InstanceType<typeof HTMLDivElement>>()
/** 操作栏信息 */
let visible = ref(false)

/** 失去焦点后modelData的下表 */
let currentDataIndex: number = 0
/** 失去焦点后当前modelData的数据 */
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
 * @param modelData的下标
 * @param modelData的数据
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

  event.target?.addEventListener('blur', blurForm)
}

/** blur事件的函数 */
const blurForm = (event: Event) => {
  if (store.modelData.value.length - 1 !== currentDataIndex) return

  if (!currentDataItem[currentColumnsItem.key]) return

  store.modelData.value = [...store.modelData.value, shallowReactive({})]
  /** 结束时候清除事件 */
  event.target?.removeEventListener('blur', blurForm)
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
  // console.log(index, 'index')
  store.modelData.value = deleteIndex(store.modelData.value, index)
}

/** 插入 */
const handleDeleteInsertData = (index: number) => {
  console.log('插入')
}

/** 监听操作栏，点击除操作栏的任何位置隐藏操作栏 */
const watchOperationViable = (e: Event) => {
  if (e.target !== operationRef.value) {
    visible.value = false
  }
}

// watch(
//   () => store.modelData.value,
//   item => {
//     store.modelData.value = wrapDataRows(item)
//     console.log(item, '触发')
//     // console.log(store.modelData.value, wrapDataRows(item), 'item')
//   },
//   {
//     immediate: true
//   }
// )

onMounted(() => {
  document.addEventListener('click', watchOperationViable)
})
onUnmounted(() => {
  document.removeEventListener('click', watchOperationViable)
})
</script>
