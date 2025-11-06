<template>
  <u-steps :items :current="current">
    <template #icon="{ index }">
      <template v-if="index < current">
        <UIcon> <Lock /> </UIcon>
      </template>
    </template>

    <template #content="{ item }">
      <div>{{ item.label }}</div>
      <div>{{ item.description }}</div>
    </template>
  </u-steps>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Lock } from '@ultra/icon'

const current = ref(2)
const items = Array.from({ length: 5 }, (_, index) => ({
  label: `步骤${index + 1}`,
  description: `步骤${index + 1}的描述`
}))
</script>
