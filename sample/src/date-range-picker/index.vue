<template>
  <div>
    <u-date-range-picker disabled v-model="value" style="width: 240px" />
    {{ value }}
  </div>
</template>

<script lang="ts" setup>
import { date } from 'cat-kit'
import { ref } from 'vue'
const value = ref<[string, string]>(['2025-03-01', date().format()])
</script>
