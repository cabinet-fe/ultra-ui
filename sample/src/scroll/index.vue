<template>
  <u-scroll tag="ul" class="bar" height="100%" ref="scrollbarRef">
    <li style="width: 2000px" v-for="i of 200" :key="i">
      {{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i
      }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i
      }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i
      }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}{{ i }}
    </li>
  </u-scroll>
</template>

<script lang="ts" setup>
import { ScrollExposed } from 'ultra-ui'
import { shallowRef } from 'vue'

const scrollbarRef = shallowRef<ScrollExposed>()
</script>

<style lang="scss" scoped>
.bar {
  border: var(--u-border);
}
</style>
