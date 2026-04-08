<template>
  <div>
    {{ items }}
    <u-group-input v-slot="{ item }" v-model="items">
      <u-input v-model="item.value1" />
      <u-input v-model="item.value2" />
      <u-input v-model="item.value3" />
    </u-group-input>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

const items = shallowRef<any[]>([])

setTimeout(() => {
  items.value = [{ value1: '1', value2: '2', value3: '3' }]
}, 1000)
</script>
