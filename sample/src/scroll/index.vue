<template>
  <div>
    <div>普通滚动</div>
    <u-scroll tag="ul" class="bar" :height="200" ref="scrollbarRef">
      {{ c.log(123) }}
      <li style="width: 2000px" v-for="i of 200" :key="i">{{ i }}</li>
    </u-scroll>

    <div>虚拟滚动</div>
    <u-virtual-scroll
      class="bar"
      :data="data"
      v-slot:default="{ item }"
      :height="500"
    >
      <u-button type="primary" v-for="i of 20" :key="i">
        {{ item.name }}
      </u-button>
    </u-virtual-scroll>
  </div>
</template>

<script lang="ts" setup>
import { ScrollExposed } from 'ultra-ui'
import { shallowRef } from 'vue'

const scrollbarRef = shallowRef<ScrollExposed>()

const data = Array.from({ length: 100000 }).map((_, i) => {
  return {
    name: 'name' + i,
    id: i
  }
})
</script>

<style lang="scss" scoped>
.bar {
  border: var(--u-border);
}
</style>
