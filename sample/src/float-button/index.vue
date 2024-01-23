<template>
  <div>
    右下角查看

    <u-radio-group v-model="size" :data="sizes"> </u-radio-group>

    <u-float-button :icon="Dialog" :items="items"> </u-float-button>
  </div>
</template>

<script lang="ts" setup>
import { Dialog } from 'icon-ultra'
import type { FloatButtonItem } from 'ultra-ui'
import { shallowRef } from 'vue'

const sizes = [
  { label: '大', value: 'large' },
  { label: '中', value: 'medium' },
  { label: '小', value: 'small' }
]

const size = shallowRef('medium')

const items: FloatButtonItem[] = [{ key: 'a' }, { key: 'b' }]
</script>
