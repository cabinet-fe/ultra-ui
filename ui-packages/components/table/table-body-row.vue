<template>
  <tr :class="cls.e('body-row')">

  </tr>
</template>

<script lang="ts" setup>
import  { inject } from 'vue'
import { TableDIKey } from './di'

const { cls } = inject(TableDIKey)!
</script>