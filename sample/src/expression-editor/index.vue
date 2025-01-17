<template>
  <u-expression-editor
    v-model="value"
    :variables="[{ key: 'a', label: 'aaaaa' }]"
  />
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

const value = shallowRef('1')
</script>
