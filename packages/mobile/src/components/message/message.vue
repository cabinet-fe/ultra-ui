<template>
  <li :class="[cls.b, cls.m('color-' + getTypeColor(type))]">
    <span :class="cls.e('icon')">
      <UIcon>
        <component :is="getTypeIcon(type, icon)" />
      </UIcon>
    </span>
    <div :class="cls.e('content')" v-if="html" v-html="message"></div>
    <div :class="cls.e('content')" v-else>
      {{ message }}
    </div>
    <button
      :class="cls.e('close')"
      v-if="closable || duration === 0"
      type="button"
      aria-label="关闭"
      @click.stop="immediateClose"
    >
      <UIcon><Close /></UIcon>
    </button>
  </li>
</template>

<script lang="ts" setup>
import { Close } from '@veltra/icons/normal'
import { onBeforeUnmount, onMounted } from 'vue'

import { bem } from '../../shared/bem'
import type { MessageProps } from '../../types/message'
import { UIcon } from '../icon'
import { getTypeColor, getTypeIcon } from './helper'

defineOptions({ name: 'UMessage' })

const props = withDefaults(defineProps<MessageProps>(), { type: 'default', duration: 3000 })

const emit = defineEmits<{ (e: 'close'): void }>()

const cls = bem('message')

// 移动端无 hover，不做悬停暂停：到时关闭，点击关闭按钮立即关闭
let timer: number | undefined

onMounted(() => {
  if (props.duration <= 0) return
  timer = setTimeout(() => emit('close'), props.duration)
})

onBeforeUnmount(() => clearTimeout(timer))

function immediateClose() {
  emit('close')
}
</script>
