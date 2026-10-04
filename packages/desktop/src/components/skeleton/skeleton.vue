<template>
  <div v-if="loading" :class="className">
    <span v-if="avatar" :class="cls.e('avatar')" />
    <div :class="cls.e('content')">
      <span v-if="title" :class="cls.e('title')" />
      <template v-if="paragraph">
        <span v-for="i in rows" :key="i" :class="cls.e('paragraph')" />
      </template>
      <span v-if="button" :class="cls.e('button')" />
    </div>
  </div>
  <slot v-else />
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed } from 'vue'

import type { SkeletonProps } from '../../types'

defineOptions({ name: 'Skeleton' })

const {
  loading = true,
  avatar = false,
  title = true,
  paragraph = true,
  rows = 3,
  button = false,
  round = false,
  animated = false
} = defineProps<SkeletonProps>()

const cls = bem('skeleton')

const className = computed(() => [cls.b, bem.is('animated', animated), bem.is('round', round)])
</script>
