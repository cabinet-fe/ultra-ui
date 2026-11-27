<template>
  <div v-if="queue.length" :class="cls.b">
    <div :class="cls.e('head')">待发送队列 · {{ queue.length }}</div>
    <div v-for="item in queue" :key="item.id" :class="cls.e('item')">
      <span :class="cls.e('text')" :title="item.content">{{ item.content }}</span>
      <span v-if="!readonly" :class="cls.e('actions')">
        <button
          type="button"
          :class="[cls.e('action'), cls.em('action', 'primary')]"
          title="中断当前会话，立即执行该条"
          @click="emit('start-now', item.id)"
        >
          <UIcon><Send /></UIcon>立即开始
        </button>
        <button
          type="button"
          :class="cls.e('action')"
          title="取回输入框编辑"
          @click="emit('edit', item.id)"
        >
          <UIcon><EditPen /></UIcon>
        </button>
        <button
          type="button"
          :class="cls.e('action')"
          title="移出队列"
          @click="emit('remove', item.id)"
        >
          <UIcon><Close /></UIcon>
        </button>
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import './style'
import { UIcon } from '@veltra/desktop'
import { Close, EditPen, Send } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'

import type { AiMessageQueueEmits, AiMessageQueueProps } from '../../types'

defineOptions({ name: 'UAiMessageQueue' })

defineProps<AiMessageQueueProps>()

const emit = defineEmits<AiMessageQueueEmits>()

const cls = bem('ai-message-queue')
</script>
