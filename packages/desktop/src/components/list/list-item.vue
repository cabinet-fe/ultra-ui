<template>
  <li :class="cls.b">
    <slot />
  </li>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'

defineOptions({ name: 'ListItem' })

const cls = bem('list-item')
</script>
