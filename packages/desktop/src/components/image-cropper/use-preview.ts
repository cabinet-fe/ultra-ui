import { watch, type ShallowRef } from 'vue'

import { drawCropToCanvas, type CropTransform } from './draw-crop'
import type { SelectionRect } from './use-selection'

interface UsePreviewOptions {
  /** 预览画布元素 */
  canvas: ShallowRef<HTMLCanvasElement | undefined>
  /** 舞台内的图片元素（已加载完成） */
  image: ShallowRef<HTMLImageElement | undefined>
  /** 当前选区（图片像素坐标） */
  selection: ShallowRef<SelectionRect | null>
  /** 影响裁剪输出的变换（缩放 / 平移不影响输出，仅旋转 / 翻转触发重绘） */
  transform: CropTransform
}

/** 实时预览：选区或旋转 / 翻转变换变化时把当前裁剪结果重绘到预览画布 */
export function usePreview(options: UsePreviewOptions): void {
  const { canvas, image, selection, transform } = options

  watch(
    [
      canvas,
      image,
      selection,
      () => transform.rotation,
      () => transform.flipX,
      () => transform.flipY
    ],
    () => {
      const el = canvas.value
      const img = image.value
      const sel = selection.value
      if (!el || !img || !sel) return
      drawCropToCanvas(img, sel, transform, el)
    },
    // post：等待 v-if 切换后画布元素完成挂载
    { flush: 'post', immediate: true }
  )
}
