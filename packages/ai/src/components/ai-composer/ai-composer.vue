<template>
  <div :class="[cls.b, bem.is('disabled', disabled)]">
    <slot name="header" />

    <slot
      v-if="currentAttachments.length || slots.attachments"
      name="attachments"
      :attachments="currentAttachments"
      :remove="removeAttachment"
      :preview="handlePreview"
    >
      <div :class="cls.e('attachments')">
        <UAiAttachments
          :items="currentAttachments"
          :removable="!disabled"
          size="compact"
          @remove="removeAttachment"
          @preview="handlePreview"
        />
      </div>
    </slot>

    <textarea
      ref="textareaRef"
      v-model="text"
      :class="cls.e('input')"
      :placeholder="placeholderText"
      :disabled="disabled"
      rows="1"
      @keydown.enter.exact="handleSend"
      @input="autoResize"
      @paste="handlePaste"
    />

    <div :class="cls.e('toolbar')">
      <slot
        name="toolbar"
        :add-attachments="addAttachments"
        :add-files="addFiles"
        :running="running"
        :disabled="disabled"
        :has-content="hasContent"
        :show-stop="showStop"
        :send="send"
        :abort="handleAbort"
      >
        <div :class="cls.e('toolbar-left')">
          <slot
            name="toolbar-left"
            :add-attachments="addAttachments"
            :add-files="addFiles"
            :disabled="disabled"
          />
        </div>

        <div :class="cls.e('toolbar-right')">
          <slot name="toolbar-right" :disabled="disabled" />

          <slot
            name="action"
            :running="running"
            :disabled="disabled"
            :has-content="hasContent"
            :show-stop="showStop"
            :send="send"
            :abort="handleAbort"
          >
            <UButton
              v-if="showStop"
              key="stop"
              size="small"
              type="danger"
              circle
              :disabled="disabled"
              title="停止生成"
              @click="handleAbort"
            >
              <span :class="cls.e('stop')" />
            </UButton>
            <UButton
              v-else
              key="send"
              size="small"
              type="primary"
              circle
              :disabled="disabled || !hasContent"
              :icon="Up"
              :title="running ? '加入待发送队列' : undefined"
              @click="send"
            />
          </slot>
        </div>
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import './style'
import { UButton } from '@veltra/desktop'
import { Up } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import {
  computed,
  getCurrentInstance,
  inject,
  nextTick,
  onMounted,
  ref,
  useTemplateRef,
  watch
} from 'vue'

import type { ChatAttachment } from '../../chat/types'
import type { _AiComposerExposed, AiComposerEmits, AiComposerProps } from '../../types'
import { isImageAttachment, readFilesAsAttachments } from '../_shared/attachment'
import { AiChatDIKey } from '../_shared/di'
import { UAiAttachments } from '../ai-attachments'

defineOptions({ name: 'UAiComposer' })

const props = withDefaults(defineProps<AiComposerProps>(), {
  modelValue: undefined,
  attachments: undefined,
  running: false,
  disabled: false,
  allowPasteImage: true,
  maxHeight: 160
})

const emit = defineEmits<AiComposerEmits>()

const slots = defineSlots<{
  header(): any
  attachments(scope: {
    attachments: ChatAttachment[]
    remove: (index: number) => void
    preview: (att: ChatAttachment) => void
  }): any
  toolbar(scope: {
    addAttachments: (items: ChatAttachment[]) => void
    addFiles: (files: File[]) => Promise<void>
    running: boolean
    disabled: boolean
    hasContent: boolean
    showStop: boolean
    send: () => void
    abort: () => void
  }): any
  'toolbar-left'(scope: {
    addAttachments: (items: ChatAttachment[]) => void
    addFiles: (files: File[]) => Promise<void>
    disabled: boolean
  }): any
  'toolbar-right'(scope: { disabled: boolean }): any
  action(scope: {
    running: boolean
    disabled: boolean
    hasContent: boolean
    showStop: boolean
    send: () => void
    abort: () => void
  }): any
}>()

const cls = bem('ai-composer')
const di = inject(AiChatDIKey, undefined)
const instance = getCurrentInstance()
const textareaRef = useTemplateRef<HTMLTextAreaElement>('textareaRef')

const innerText = ref(props.modelValue ?? '')
const innerAttachments = ref<ChatAttachment[]>(props.attachments ? [...props.attachments] : [])

const text = computed({
  get: () => (props.modelValue !== undefined ? props.modelValue : innerText.value),
  set: (val: string) => {
    innerText.value = val
    emit('update:modelValue', val)
  }
})

const currentAttachments = computed({
  get: () => (props.attachments !== undefined ? props.attachments : innerAttachments.value),
  set: (val: ChatAttachment[]) => {
    // 始终替换新数组引用，确保受控 v-model:attachments 每次增删清空稳定触发
    const next = [...val]
    innerAttachments.value = next
    emit('update:attachments', next)
  }
})

const placeholderText = computed(() => {
  if (props.running) {
    return props.runningPlaceholder ?? '会话进行中，发送的消息将进入待发送队列'
  }
  return props.placeholder ?? '输入消息，Enter 发送，Shift + Enter 换行'
})

const hasContent = computed(() => !!text.value.trim() || currentAttachments.value.length > 0)

/** 生成中且输入为空时显示停止；有内容则显示发送（入队） */
const showStop = computed(() => props.running && !hasContent.value)

const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  const nextHeight = Math.min(el.scrollHeight, props.maxHeight)
  el.style.height = `${nextHeight}px`
  el.style.overflowY = el.scrollHeight > props.maxHeight ? 'auto' : 'hidden'
}

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined) {
      innerText.value = val
      void nextTick(autoResize)
    }
  }
)

watch(
  () => props.attachments,
  (val) => {
    if (val !== undefined) {
      innerAttachments.value = [...val]
    }
  }
)

watch([placeholderText, () => props.maxHeight], () => {
  void nextTick(autoResize)
})

onMounted(() => {
  if (text.value) autoResize()
})

const handleSend = (e?: Event) => {
  if (props.disabled) return
  // 输入法组合态的回车只是确认上屏，不发送：Chromium 在 compositionend 前发
  // isComposing=true 的 keydown；Safari 在 compositionend 后补发 keyCode 229 的
  // keydown。不过滤会把组合前的旧输入提前发出（串消息），或上屏即误发送。
  if (e instanceof KeyboardEvent) {
    if (e.isComposing || e.keyCode === 229) return
    e.preventDefault()
  }
  if (!hasContent.value) return
  const content = text.value.trim()
  const outAttachments = [...currentAttachments.value]
  text.value = ''
  currentAttachments.value = []
  void nextTick(autoResize)
  emit('send', content, outAttachments)
}

const send = () => handleSend()

const handleAbort = () => {
  if (props.disabled) return
  emit('abort')
}

const removeAttachment = (index: number) => {
  if (props.disabled) return
  const list = currentAttachments.value
  if (index < 0 || index >= list.length) return
  currentAttachments.value = list.filter((_, i) => i !== index)
}

const addAttachments = (items: ChatAttachment[]) => {
  if (!items.length) return
  currentAttachments.value = [...currentAttachments.value, ...items]
}

const addFiles = async (files: File[]) => {
  if (!files.length) return
  const parsed = await readFilesAsAttachments(files, props.maxAttachmentSize, 'UAiComposer')
  if (parsed.length) addAttachments(parsed)
}

/** 从剪贴板提取图片文件（支持截图与复制图片） */
const handlePaste = (e: ClipboardEvent) => {
  if (props.disabled || !props.allowPasteImage) return
  const clipboard = e.clipboardData
  if (!clipboard) return

  const imageFiles: File[] = []
  if (clipboard.items?.length) {
    for (const item of Array.from(clipboard.items)) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) imageFiles.push(file)
      }
    }
  } else if (clipboard.files?.length) {
    for (const file of Array.from(clipboard.files)) {
      if (isImageAttachment({ name: file.name, mimeType: file.type })) {
        imageFiles.push(file)
      }
    }
  }

  if (!imageFiles.length) return
  if (!clipboard.getData('text/plain')) {
    e.preventDefault()
  }
  const normalized = imageFiles.map((file, index) => {
    if (file.name) return file
    const ext = file.type.split('/')[1]?.replace('+xml', '') || 'png'
    return new File([file], `image-${Date.now()}-${index}.${ext}`, {
      type: file.type || 'image/png'
    })
  })
  void addFiles(normalized)
}

/** 图片预览：优先派发 preview-image 事件；未显式监听时回落 DI 全屏图片预览 */
const handlePreview = (att: ChatAttachment) => {
  emit('preview-image', att.dataUrl, att.name)
  const vnodeProps = instance?.vnode.props
  if (!vnodeProps?.onPreviewImage && !vnodeProps?.['onPreview-image']) {
    di?.previewImage?.(att.dataUrl, att.name)
  }
}

/** 设置输入框内容并自适应高度与聚焦（队列编辑场景） */
const setContent = (content: string) => {
  text.value = content
  void nextTick(() => {
    autoResize()
    textareaRef.value?.focus()
  })
}

const getContent = () => text.value

const focus = () => textareaRef.value?.focus()

defineExpose<_AiComposerExposed>({ setContent, getContent, focus, addAttachments, addFiles })
</script>
