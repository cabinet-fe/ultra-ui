<template>
  <div>
    <u-checkbox v-model="config.multiple">multiple</u-checkbox>
    <u-auto-complete :suggestions="suggestions" :multiple="config.multiple"></u-auto-complete>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

const suggestions = Array.from({ length: 100 }, (v, i) => `${i + 1}`)

const config = reactive({
  multiple: true
})
</script>
