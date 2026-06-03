<template>
  <u-icon v-if="typeof icon !== 'string'">
    <component :is="icon" />
  </u-icon>

  <img :src="icon" v-else alt="icon" />
</template>

<script lang="ts" setup>
import type { DefineComponent } from 'vue'

import { UIcon } from '../icon'

defineOptions({ name: 'MenuIcon' })

defineProps<{ icon: string | DefineComponent }>()
</script>
