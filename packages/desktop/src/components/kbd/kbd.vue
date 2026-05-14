<template>
  <kbd :class="cls.b">
    <slot />
  </kbd>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'

defineOptions({ name: 'Kbd' })

const cls = bem('kbd')
</script>
