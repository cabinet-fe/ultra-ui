<template>
  <u-checkbox v-model="checked" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import UCheckbox from './checkbox.vue'

const checked = ref('1')
</script>

<style lang="scss" scoped></style>
