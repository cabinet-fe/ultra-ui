<template>
  <div>
    <u-scroll style="padding: 10px" tag="div" class="scroll" ref="scrollbarRef" always>
      <ul>
        <li style="width: 2000px" v-for="i of 200" :key="i">
          {{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i
          }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i
          }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i
          }}{{ i }}{{ i }}
        </li>
      </ul>

      <u-dropdown min-width="200px" trigger="click">
        <template #trigger>
          <u-button>aaaaa</u-button>
        </template>

        <template #content>
          <div>11111</div>
          <div>11111</div>
          <div>11111</div>
          <div>11111</div>
          <div>11111</div>
        </template>
      </u-dropdown>
    </u-scroll>

    <u-button @click="scrollToTop">滚动到顶部</u-button>
    <u-button @click="scrollToLeft">滚动到左侧</u-button>
  </div>
</template>

<script lang="ts" setup>
import type { ScrollExposed } from '@veltra/desktop'
import { shallowRef } from 'vue'

const scrollbarRef = shallowRef<ScrollExposed>()

function scrollToTop() {
  scrollbarRef.value?.scrollTo({ y: 0 })
}

function scrollToLeft() {
  scrollbarRef.value?.scrollTo({ x: 0 })
}
</script>

<style lang="scss">
.header,
.footer {
  height: 60px;
  flex-shrink: 0;
}
.scroll {
  border: var(--u-border);
  flex-grow: 1;
  height: 20vh;
}
</style>
