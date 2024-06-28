<template>
  <li :class="cls.b">
    <slot />
  </li>
</template>

<script lang="ts" setup>
import { bem } from '@ui/utils'

defineOptions({
  name: 'ListItem'
})

const cls = bem('list-item')
</script>
