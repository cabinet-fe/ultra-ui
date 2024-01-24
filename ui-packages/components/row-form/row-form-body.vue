<template>
  <tbody :class="store.cls.e('tbody')">
    <tr
      v-for="(dataItem, dataIndex) of store.modelData"
      :key="dataIndex"
      :class="store.cls.em('tbody', 'hover')"
      @contextmenu.prevent="handleDblClick"
    >
      <!-- 内容 -->
      <td
        v-for="(columnsItem, columnsIndex) of store.columns"
        :key="columnsIndex"
      >
        <div
          @click="value => handleClick(value, dataIndex, dataItem, columnsItem)"
        >
          <slot ref="slotsRef" :name="columnsItem.key" :row="dataItem" />
        </div>
      </td>
    </tr>

    <div
      v-if="visible"
      ref="operationRef"
      :style="`left: ${layerX}px; top: ${layerY}px`"
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
  </tbody>
</template>
<script lang="ts" setup>
import { inject, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { RowFormStoreType } from './di'
import type { RowFormColumn, RowFormOperation } from './row-form.type'

let store = inject(RowFormStoreType)!

const operationArray: RowFormOperation[] = [
  { key: 'delete', name: '删除' },
  { key: 'insert', name: '插入' }
]

/** 操作栏信息的ref */
const operationRef = shallowRef<InstanceType<typeof HTMLDivElement>>()

/** 失去焦点后modelData的下表 */
let currentDataIndex: number = 0
/** 失去焦点后当前modelData的数据 */
let currentDataItem: Record<string, any> = {}
/** 失去焦点后columns当前的数据 */
let currentColumnsItem: RowFormColumn

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
  if (store.modelData.length - 1 !== currentDataIndex) return

  if (!currentDataItem[currentColumnsItem.key]) return

  store.modelData.push({})

  /** 结束时候清除事件 */
  event.target?.removeEventListener('blur', blurForm)
}

/** 获取右键信息 */
let layerX = ref<number>(0)
let layerY = ref<number>(0)

/** 操作栏删除 */
const handleOperationData = (item: Record<string, any>, index: number) => {
  if (item['key'] === 'delete') {
    if (store.modelData.length === 1) return alert('求你了别删除最后一条')
    store.modelData.splice(index, 1)
  }
}

/** 操作栏信息 */
let visible = ref(false)

/** 右击事件 */
const handleDblClick = (event: any) => {
  layerX.value = event.layerX
  layerY.value = event.layerY

  visible.value = true
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
<style lang="scss" scoped>
td {
  text-align: center;
  padding: 10px 0;
  min-width: 150px;
}
</style>
