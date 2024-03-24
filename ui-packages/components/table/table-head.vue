<template>
  <thead :class="cls.e('head')">
    <tr v-for="">
      <th></th>
    </tr>
  </thead>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { TableDIKey } from './di'

defineOptions({
  name: 'TableHead'
})

const { cls, columns } = inject(TableDIKey)!

const { fixedOnLeft, unfixed, fixedOnRight } = columns
</script>
