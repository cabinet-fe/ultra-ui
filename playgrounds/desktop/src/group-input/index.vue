<template>
  <div style="padding: 24px; max-width: 640px">
    <h2>CSS 对象</h2>
    <p>{{ items1 }}</p>
    <u-group-input v-slot="{ item }" v-model="items1" :item-style="style1">
      <u-input v-model="item.name" placeholder="名称" />
      <u-input v-model="item.age" placeholder="年龄" />
    </u-group-input>

    <h2 style="margin-top: 40px">CSS 字符串</h2>
    <p>{{ items2 }}</p>
    <u-group-input
      v-slot="{ item }"
      v-model="items2"
      item-style="padding: 12px; border: 1px solid #e5e5e5; border-radius: 6px; margin-bottom: 8px; background: #fafafa"
    >
      <u-input v-model="item.name" placeholder="名称" />
      <u-input v-model="item.age" placeholder="年龄" />
    </u-group-input>

    <h2 style="margin-top: 40px">响应式 itemStyle</h2>
    <p>{{ items3 }}</p>
    <u-group-input v-slot="{ item }" v-model="items3" :item-style="style3">
      <u-input v-model="item.name" placeholder="名称" />
      <u-input v-model="item.age" placeholder="年龄" />
    </u-group-input>
  </div>
</template>

<script lang="ts" setup>
import { computed, shallowRef } from 'vue'

// === CSS 对象 ===
const items1 = shallowRef<{ name: string; age: string }[]>([])

const style1 = {
  display: 'flex',
  gap: '12px',
  padding: '10px',
  border: '1px solid #d9d9d9',
  borderRadius: '4px',
  marginBottom: '8px'
}

// === CSS 字符串 ===
const items2 = shallowRef<{ name: string; age: string }[]>([])

// === 响应式 itemStyle：超过 2 条时收紧间距 ===
const items3 = shallowRef<{ name: string; age: string }[]>([])

const style3 = computed(() => ({
  display: 'flex',
  gap: '12px',
  padding: '10px',
  borderLeft: items3.value.length > 2 ? '3px solid #1677ff' : '3px solid #d9d9d9',
  borderRadius: '4px',
  marginBottom: items3.value.length > 2 ? '4px' : '12px'
}))
</script>
