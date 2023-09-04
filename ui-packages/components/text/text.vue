<template>
  <p :class="cls.b"></p>
</template>

<script lang="ts" setup>
import { TextProps } from './text.type'
import { bem } from '@ui/utils'

defineOptions({
  name: 'Text'
})

defineProps<TextProps>()

const cls = bem('text')
</script>
