<template>
  <kbd :class="cls.b">
    <slot />
  </kbd>
</template>

<script lang="ts" setup>
import './style'
import { bem } from '@veltra/utils'

defineOptions({ name: 'UKbd' })

const cls = bem('kbd')
</script>
