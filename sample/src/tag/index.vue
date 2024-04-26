<template>
  <div class="tags">
    <CustomCard title="基本用法">
      <u-tag>默认</u-tag>
      <u-tag v-for="item of types" :type="item">{{ item.toUpperCase() }}</u-tag>
    </CustomCard>

    <CustomCard title="深色">
      <u-tag light>默认</u-tag>
      <u-tag v-for="item of types" dark :type="item">{{ item.toUpperCase() }}</u-tag>
    </CustomCard>

    <CustomCard title="可移除">
      <u-tag v-for="(item, index) in tags" :type="item.type" closable @close="handleClose(index)">
        {{ item.name }}
      </u-tag>
    </CustomCard>

    <CustomCard title="动态编辑">
      <u-tag v-for="(item, index) in tags" :type="item.type" closable @close="handleClose(index)">
        {{ item.name }}
      </u-tag>
    </CustomCard>

    <CustomCard title="不同尺寸">
      <u-tag size="small"> small </u-tag>
      <u-tag size="default"> default </u-tag>
      <u-tag size="large"> large </u-tag>
    </CustomCard>

    <CustomCard title="圆形标签">
      <u-tag v-for="item of types" round :type="item">
        {{ item.toUpperCase() }}
      </u-tag>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue'
import CustomCard from '../card/custom-card.vue'
import type { ColorType } from 'ultra-ui'

const tags = shallowRef<
  Array<{
    name: string
    type?: ColorType
  }>
>([
  { name: '默认' },
  { name: 'Tag 1', type: 'primary' },
  { name: 'Tag 2', type: 'success' },
  { name: 'Tag 3', type: 'info' },
  { name: 'Tag 4', type: 'warning' },
  { name: 'Tag 5', type: 'danger' }
])

const types: ColorType[] = ['primary', 'info', 'success', 'warning', 'danger']

/** 可移除标签 */
const handleClose = (index: number) => {
  tags.value = tags.value.filter((_, i) => i !== index)
}
</script>

<style lang="scss" scoped>
.tags {
  :deep(.u-tag) {
    margin-right: 6px;
  }
}
</style>
