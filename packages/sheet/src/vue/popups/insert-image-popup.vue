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
</template>

<script lang="ts" setup>
import { UFilePicker } from '@veltra/desktop'
import { bem } from '@veltra/utils'

import type { SheetContext } from '../../tools/context'
import { INSERT_IMAGE_ACCEPT, insertImageFromFile } from '../insert-image'

defineOptions({ name: 'USheetInsertImagePopup' })

/**
 * 插入图片面板（UFilePicker）：选文件后走共享 insertImageFromFile，锚定当前选区活动格。
 * 不参与面板事务（单次插入 = 一个 undo 单元）。
 */
const props = defineProps<{ context: SheetContext }>()

const emit = defineEmits<{ close: [] }>()

const cls = bem('sheet')

function handlePick(files: File[]): void {
  const file = files[0]
  if (!file) return
  emit('close')
  void insertImageFromFile(props.context, file)
}
</script>
