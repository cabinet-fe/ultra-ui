<template>
  <div :class="cls.b">通知组件</div>
</template>

<script lang="ts" setup>
import type { NotificationProps } from '@ui/types/components/notification'
import { bem } from '@ui/utils'

defineOptions({
  name: 'Notification'
})

defineProps<NotificationProps>()

const cls = bem('notification')
</script>
