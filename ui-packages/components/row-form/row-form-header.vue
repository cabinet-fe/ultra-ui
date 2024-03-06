<template>
  <thead :class="cls.e('thead')">
    <th :class="cls.em('thead', 'th')" v-for="item in store.columns.value">
      {{ item.name }}
      <span v-if="item.rules?.required" :class="cls.em('thead', 'required')">
        *
      </span>
    </th>
    <th>操作</th>
  </thead>
</template>
<script lang="ts" setup>
import { inject, type PropType } from 'vue'
import { type RowFormColumn } from '@ui/types/components/row-form'
import { bem } from '@ui/utils'
import { RowFormStoreType } from './di'

defineProps({
  columns: { type: Array as PropType<RowFormColumn[]> }
})

const cls = bem('row-form')

let store = inject(RowFormStoreType)!
</script>
