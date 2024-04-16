<template>
  <div :class="cls.b">message-confirm</div>
</template>

<script lang="ts" setup>
import type { MessageConfirmProps } from '@ui/types/components/message-confirm'
import { bem } from '@ui/utils'

defineOptions({
  name: 'MessageConfirm'
})

defineProps<MessageConfirmProps>()

const cls = bem('message-confirm')
</script>
