<template>
  <thead :class="cls.e('thead')">
    <th :class="cls.e('th')" v-for="item in columns">
      {{ item.name }}
      <span v-if="item.rule?.require" :class="cls.be('require', 'th')">
        *
      </span>
    </th>

    <th :class="cls.e('th-action-columns')">操作</th>
  </thead>
</template>
<script lang="ts" setup>
import type { PropType } from 'vue'
import type {
TableEditorColumn
} from '../table-editor/table-editor.type'

defineProps({
  columns: { type: Array as PropType<TableEditorColumn[]> }
})

import { bem } from '@ui/utils'

const cls = bem('table-editor')
</script>
<style scoped>
th {
  text-align: center;
  padding: 15px;
}
</style>
