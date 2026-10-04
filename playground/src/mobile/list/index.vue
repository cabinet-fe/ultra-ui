<template>
  <div class="demo">
    <section>
      <h3>基础列表</h3>
      <UList :data="listData" v-slot="{ item }" class="scroll-area">
        <UListItem>{{ item.title }}</UListItem>
      </UList>
    </section>

    <section>
      <h3>尺寸</h3>
      <UList :data="sizeData" size="small" v-slot="{ item }">
        <UListItem>small：{{ item.title }}</UListItem>
      </UList>
      <UList :data="sizeData" v-slot="{ item }">
        <UListItem>default：{{ item.title }}</UListItem>
      </UList>
      <UList :data="sizeData" size="large" v-slot="{ item }">
        <UListItem>large：{{ item.title }}</UListItem>
      </UList>
    </section>

    <section>
      <h3>点击选择</h3>
      <UList :data="listData" v-slot="{ item, index }" class="scroll-area">
        <UListItem :class="{ 'is-selected': index === selected }" @click="selected = index">
          {{ item.title }}
        </UListItem>
      </UList>
      <p class="note">已选：{{ selected === null ? '未选择' : `列表项${selected}` }}</p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UList, UListItem } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/list/style'

const listData = Array.from({ length: 50 }).map((_, i) => ({ title: `列表项${i}` }))

const sizeData = listData.slice(0, 3)

const selected = shallowRef<number | null>(null)
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证移动端密度与触控行高
.demo {
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-color-title);
  }
}

.scroll-area {
  height: 220px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

:deep(.um-list-item) {
  &.is-selected {
    color: var(--u-color-primary);
    background-color: var(--u-color-primary-light-9);
  }
}

.note {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--u-text-color-secondary);
}
</style>
