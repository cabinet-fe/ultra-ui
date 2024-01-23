<template>
  <div>
    右下角查看

    <u-radio-group v-model="size" :data="sizes"> </u-radio-group>

    <div>浮动按钮</div>

    <u-float-button :items="items"> </u-float-button>
  </div>
</template>

<script lang="ts" setup>
import type { FloatButtonItem } from 'ultra-ui'
import { shallowRef } from 'vue'

const sizes = [
  { label: '大', value: 'large' },
  { label: '中', value: 'medium' },
  { label: '小', value: 'small' }
]

const size = shallowRef('medium')

const items: FloatButtonItem[] = [{ key: 'a', name: '你好' }, { key: 'b', name: '世界' }]
</script>
