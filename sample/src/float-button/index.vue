<template>
  <div>
    右下角查看

    <input
      type="radio"
      v-model="size"
      v-for="item in sizes"
      :key="item.value"
      :value="item.value"
    />

    <div>浮动按钮</div>

    <u-float-button :items="items" :size="size"> </u-float-button>
  </div>
</template>

<script lang="ts" setup>
import type { ComponentSize, FloatButtonItem } from 'ultra-ui'
import { shallowRef } from 'vue'

const sizes = [
  { label: '大', value: 'large' },
  { label: '中', value: 'default' },
  { label: '小', value: 'small' }
]

const size = shallowRef<ComponentSize>('default')

const items: FloatButtonItem[] = [
  { key: 'a', name: '你' },
  { key: 'b', name: '好' },
  { key: 'c', name: '世' },
  { key: 'd', name: '界' }
]
</script>
