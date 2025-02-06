<template>
  <u-expression-editor v-model="value" :variables />
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

const value = shallowRef()

const variables = [
  { value: 'a', label: '基础信息' },
  { value: 'b', label: '订单信息' },
  { value: 'c', label: '商品信息' }
]
</script>
