<template>
  <CustomCard title="基础">
    <u-cascade-select v-model="cascade" />
  </CustomCard>
</template>
<script lang="ts" setup>
import { shallowRef } from 'vue'

const cascade = shallowRef([])
</script>
