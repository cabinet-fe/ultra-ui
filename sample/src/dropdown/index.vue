<template>
  <div>
    <div style="height: 80vh">
      <u-radio-group :items="items" v-model="trigger" />
    </div>

    <div style="display: flex; justify-content: right">
      <u-dropdown :trigger="trigger" class="bb" width="200px">
        <template #trigger>
          <u-button>dropdown-hover</u-button>
        </template>

        <template #content>
          <ul>
            <li>第一层hover第一层hover第一层hover第一层hover第一层hover</li>
            <li>第二层hover</li>
            <li>第三层hover</li>
            <li>第四层hover</li>
            <li>第五层hover</li>
            <li>第六层hover</li>
          </ul>
        </template>
      </u-dropdown>


    </div>

    <div style="height: 80vh"></div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'

const items = [
  { label: '浮动', value: 'hover' },
  { label: '点击', value: 'click' },
]

const trigger = shallowRef<'hover' | 'click'>('hover')
</script>


