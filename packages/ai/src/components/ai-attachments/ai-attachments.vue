<template>
  <div v-if="items.length" :class="[cls.b, cls.m(size)]">
    <div
      v-for="(att, index) in items"
      :key="`${att.name}-${att.size}-${index}`"
      :class="[
        cls.e('item'),
        bem.is('image', isImageAttachment(att)),
        bem.is('file', !isImageAttachment(att)),
        bem.is('removable', removable)
      ]"
    >
      <slot
        name="item"
        :item="att"
        :index="index"
        :is-image="isImageAttachment(att)"
        :remove="() => emit('remove', index, att)"
        :preview="() => handlePreview(att, index)"
      >
        <img
          v-if="isImageAttachment(att)"
          :src="att.dataUrl"
          :alt="att.name"
          :title="att.name"
          :class="cls.e('image')"
          @click="handlePreview(att, index)"
        />
        <template v-else>
          <span :class="cls.e('ext')">{{ getAttachmentExtBadge(att) }}</span>
          <div :class="cls.e('meta')">
            <span :class="cls.e('name')" :title="att.name">{{ att.name }}</span>
            <span :class="cls.e('size')">{{ formatAttachmentSize(att.size) }}</span>
          </div>
        </template>
        <UIcon
          v-if="removable"
          :class="cls.e('remove')"
          title="移除附件"
          @click.stop="emit('remove', index, att)"
        >
          <Close />
        </UIcon>
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import './style'
import { UIcon } from '@veltra/desktop'
import { Close } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { getCurrentInstance, inject } from 'vue'

import type { ChatAttachment } from '../../chat/types'
import type { AiAttachmentsEmits, AiAttachmentsProps } from '../../types'
import {
  formatAttachmentSize,
  getAttachmentExtBadge,
  isImageAttachment
} from '../_shared/attachment'
import { AiChatDIKey } from '../_shared/di'

defineOptions({ name: 'UAiAttachments' })

withDefaults(defineProps<AiAttachmentsProps>(), { removable: false, size: 'default' })

const emit = defineEmits<AiAttachmentsEmits>()

defineSlots<{
  item(scope: {
    item: ChatAttachment
    index: number
    isImage: boolean
    remove: () => void
    preview: () => void
  }): any
}>()

const cls = bem('ai-attachments')
const di = inject(AiChatDIKey, undefined)
const instance = getCurrentInstance()

/** 预览附件：优先派发 preview 事件；未显式监听时回落 DI 全屏图片预览 */
const handlePreview = (att: ChatAttachment, index: number) => {
  emit('preview', att, index)
  if (!instance?.vnode.props?.onPreview && isImageAttachment(att)) {
    di?.previewImage?.(att.dataUrl, att.name)
  }
}
</script>
