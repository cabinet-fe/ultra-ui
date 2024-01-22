<template>
  <tbody :class="store.cls.e('tbody')">
    <tr
      :class="store.cls.e('tr')"
      v-for="(dataItem, dataIndex) in store.data"
      :key="dataIndex"
    >
      <!-- 内容 -->
      <td
        v-for="(columnsItem, columnsIndex) in store.columns"
        :key="columnsIndex"
      >
        <slot ref="slotsRef" :name="columnsItem.key" :row="dataItem" />
      </td>
    </tr>
  </tbody>
</template>
<script lang="ts" setup>
import { inject } from 'vue'
import { RowFormStoreType } from './row-form.type'

let store = inject(RowFormStoreType)!
</script>
<style></style>
