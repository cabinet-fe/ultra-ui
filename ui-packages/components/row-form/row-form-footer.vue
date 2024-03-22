<template>
  <tfoot :class="store.cls.e('tfoot')" >
    <tr>
      <!-- <td colspan="5">表尾合计</td> -->
    </tr>
  </tfoot>
</template>
<script lang="ts" setup>
import { inject } from 'vue'
import { RowFormInjectType } from './di'

let store = inject(RowFormInjectType)!
</script>
<style lang="scss" scoped></style>
