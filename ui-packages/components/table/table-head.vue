<template>
  <thead :class="cls.e('head')" ref="">
    <!-- <tr v-for="">
      <th></th>
    </tr> -->
    {{ c.log(headers) }}
  </thead>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { TableDIKey } from './di'

defineOptions({
  name: 'TableHead'
})

const { cls, columns } = inject(TableDIKey)!

const { fixedOnLeft, unfixed, fixedOnRight, headers } = columns
</script>
