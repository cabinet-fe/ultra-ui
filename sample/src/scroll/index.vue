<template>
  <u-scroll tag="ul" class="bar" ref="scrollbarRef">
    <li style="width: 2000px" v-for="i of 200" :key="i">
      {{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i
      }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i
      }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i
      }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}
    </li>
  </u-scroll>
</template>

<script lang="ts" setup>
import type { ScrollExposed } from 'ultra-ui'
import { shallowRef } from 'vue'

const scrollbarRef = shallowRef<ScrollExposed>()
</script>

<style lang="scss" scoped>
.header,
.footer {
  height: 60px;
  flex-shrink: 0;
}
.bar {
  border: var(--u-border);
  flex-grow: 1;
  height: 90vh;
}
</style>
