<template>
  <thead :class="cls.e('thead')">
    <th :class="cls.e('th')" v-for="item in store.columns">
      {{ item.name }}
      <span v-if="item.rule?.require" :class="cls.be('require', 'th')">
        *
      </span>
    </th>
  </thead>
</template>
<script lang="ts" setup>
import { inject, type PropType } from 'vue'
import { type RowFormColumn } from '../row-form/row-form.type'
import { bem } from '@ui/utils'
import { RowFormStoreType } from './di'

defineProps({
  columns: { type: Array as PropType<RowFormColumn[]> }
})

const cls = bem('row-form')

let store = inject(RowFormStoreType)!
</script>
<style scoped>
th {
  text-align: center;
  padding: 15px;
}
</style>
