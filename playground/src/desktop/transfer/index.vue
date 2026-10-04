<template>
  <div>
    <CustomCard title="基础用法">
      <u-transfer v-model="targetKeys" :data-source="options" :titles="['源列表', '目标列表']" />
      <p>targetKeys：{{ targetKeys }}</p>
    </CustomCard>

    <CustomCard title="搜索过滤">
      <u-transfer v-model="searchableKeys" :data-source="options" filterable />
    </CustomCard>

    <CustomCard title="禁用项">
      <u-transfer v-model="disabledKeys" :data-source="disabledOptions" />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const options = Array.from({ length: 8 }).map((_, i) => ({ key: i + 1, label: `选项${i + 1}` }))

const targetKeys = shallowRef<(string | number)[]>([2, 5])

const searchableKeys = shallowRef<(string | number)[]>([])

const disabledOptions = [
  { key: 'read', label: '可读', disabled: true },
  { key: 'write', label: '可写' },
  { key: 'remove', label: '可删除', disabled: true },
  { key: 'share', label: '可分享' },
  { key: 'download', label: '可下载' }
]

const disabledKeys = shallowRef<(string | number)[]>(['read', 'write'])
</script>

<style lang="scss" scoped></style>
