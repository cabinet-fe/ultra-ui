<template>
  <div :class="cls.b">messageeeeeeeeeeeeeee!</div>
</template>

<script lang="ts" setup>
import type { MessageProps } from '@ui/types/components/message'
import { bem } from '@ui/utils'

defineOptions({
  name: 'Message'
})

defineProps<MessageProps>()

const cls = bem('message')
</script>
