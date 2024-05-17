<script setup>
import { onMounted, ref } from 'vue'

const count = ref(0)

onMounted(() => {
  console.log(1)
})
</script>

<template>
  <p>Current component: A</p>
  <span>count: {{ count }}</span>
  <button @click="count++">+</button>
</template>
