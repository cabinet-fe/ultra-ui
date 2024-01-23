<template>
  <tbody :class="store.cls.e('tbody')">
    <tr
      :class="store.cls.e('tr')"
      v-for="(dataItem, dataIndex) of store.modelData"
      :key="dataIndex"
    >
      <!-- 内容 -->
      <td
        v-for="(columnsItem, columnsIndex) of store.columns"
        :key="columnsIndex"
      >
        <div
          @contextmenu="handleDblClick"
          @click="value => handleClick(value, dataIndex, dataItem, columnsItem)"
        >
          <slot ref="slotsRef" :name="columnsItem.key" :row="dataItem" />
        </div>
      </td>
    </tr>
  </tbody>
</template>
<script lang="ts" setup>
import { inject } from 'vue'

import { RowFormStoreType } from './di'
import type { RowFormColumn } from './row-form.type'

let store = inject(RowFormStoreType)!

/** 右击事件 */
const handleDblClick = () => {}

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
  event.target?.addEventListener('blur', e => {
    /** 如果不是最后一条不往下执行 */
    if (store.modelData.length - 1 !== dataIndex) return

    /** 如果最后一条为空也不往下执行 */
    if (!dataItem[columnsItem.key]) return

    /** 加一条新数据 */
    store.modelData.push({})
  })
}
</script>
<style lang="scss" scoped>
td {
  text-align: center;
  padding: 10px 0;
  min-width: 150px;
}
</style>
