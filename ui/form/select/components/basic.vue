<template>
  <u-select v-model="v" />
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import USelect from '../select.vue'

const v = shallowRef('')
</script>
