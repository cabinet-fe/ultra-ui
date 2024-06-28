<template>
  <div>
    <CustomCard title="基础使用">
      <u-auto-complete :suggestions="suggestions" v-model="value" />
    </CustomCard>

    <CustomCard title="函数动态获取">
      <u-auto-complete :suggestions="suggestionsGetter" v-model="value" />
    </CustomCard>

    <div>
      {{ value }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'

const suggestions = Array.from({ length: 100 }, (v, i) => {
  return `label${i + 1}`
})

const value = shallowRef('')

const suggestionsGetter = (modelValue?: string) => {
  if (!modelValue) return suggestions

  return suggestions.filter(s => s === modelValue)
}
</script>
