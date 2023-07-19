<template>
  <u-checkbox v-model="checked">
    是否
  </u-checkbox>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const checked = ref(false)
</script>

<style lang="scss" scoped></style>
