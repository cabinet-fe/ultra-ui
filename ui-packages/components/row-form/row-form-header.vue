<template>
  <thead :class="cls.e('thead')">
    <th :class="cls.e('th')" v-for="item in columns">
      {{ item.name }}
      <span v-if="item.rule?.require" :class="cls.be('require', 'th')">
        *
      </span>
    </th>
  </thead>
</template>
<script lang="ts" setup>
import type { PropType } from 'vue'
import type { RowFormColumn } from '../row-form/row-form.type'

defineProps({
  columns: { type: Array as PropType<RowFormColumn[]> }
})

import { bem } from '@ui/utils'

const cls = bem('row-form')
</script>
<style scoped>
th {
  text-align: center;
  padding: 15px;
}
</style>
