<template>
  <tfoot :class="cls.e('foot')">

  </tfoot>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { TableDIKey } from './di'

defineOptions({
  name: 'TableFoot'
})

const { cls } = inject(TableDIKey)!
</script>
