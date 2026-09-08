<template>
  <u-file-picker
    :accept="INSERT_IMAGE_ACCEPT"
    :class="cls.e('insert-image-picker')"
    @pick="handlePick"
  >
    <div :class="cls.e('insert-image-hint')">
      选择图片文件
      <div :class="cls.e('insert-image-sub')">支持 png / jpeg / gif / svg / webp</div>
    </div>
  </u-file-picker>
  <div :class="cls.e('popup-row')">
    <u-input
      v-model="imageUrl"
      placeholder="输入图片 URL"
      size="small"
      @keydown.enter="handleUrlInsert"
    />
    <u-button size="small" type="primary" :disabled="!imageUrl.trim()" @click="handleUrlInsert">
      插入
    </u-button>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UFilePicker, UInput } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { ref } from 'vue'

import type { SheetContext } from '../../../tools/context'
import { INSERT_IMAGE_ACCEPT, insertImageFromFile, insertImageFromUrl } from '../insert-image'

defineOptions({ name: 'USheetInsertImagePopup' })

/**
 * 插入图片面板：UFilePicker 选本地文件，或输入图片 URL 插入；均走共享
 * insertImageFromFile / insertImageFromUrl，锚定当前选区活动格。
 * 不参与面板事务（单次插入 = 一个 undo 单元）。
 */
const props = defineProps<{ context: SheetContext }>()

const emit = defineEmits<{ close: [] }>()

const cls = bem('sheet')

const imageUrl = ref('')

function handlePick(files: File[]): void {
  const file = files[0]
  if (!file) return
  emit('close')
  void insertImageFromFile(props.context, file)
}

function handleUrlInsert(): void {
  if (!imageUrl.value.trim()) return
  emit('close')
  insertImageFromUrl(props.context, imageUrl.value)
}
</script>
