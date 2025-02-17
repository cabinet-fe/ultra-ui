<template>
  <div>
    <u-expression-editor v-model="value" :variables />

    <div>
      {{ value }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

const value = shallowRef('Hello {form.name}, welcome to {form.company}!')

const variables = [
  { label: '姓名', value: 'form.name' },
  { label: '公司', value: 'form.company' }
]
</script>
