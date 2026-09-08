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
  /** 裁剪画布区尺寸，预览显示尺寸以它的 30% 为上限 */
  canvasSize: () => { width: number; height: number }
}

/**
 * 实时预览：选区或旋转 / 翻转变换变化时把当前裁剪结果重绘到预览画布。
 * 画布按显示尺寸（等比缩放到画布区 30% 以内）绘制，不能靠 CSS max-width/max-height 约束
 * ——父级为 shrink-to-fit 宽度时百分比 max 约束失效，画布会按原尺寸溢出被裁剪
 */
export function usePreview(options: UsePreviewOptions): void {
  const { canvas, image, selection, transform, canvasSize } = options

  watch(
    [
      canvas,
      image,
      selection,
      () => transform.rotation,
      () => transform.flipX,
      () => transform.flipY,
      () => {
        const size = canvasSize()
        return [size.width, size.height]
      }
    ],
    () => {
      const el = canvas.value
      const img = image.value
      const sel = selection.value
      if (!el || !img || !sel) return

      // 与 drawCropToCanvas 相同的宽高交换规则，先求旋转后的基准尺寸
      const swapped = transform.rotation % 180 !== 0
      const baseW = swapped ? sel.height : sel.width
      const baseH = swapped ? sel.width : sel.height

      const size = canvasSize()
      const scale = Math.min((size.width * 0.3) / baseW, (size.height * 0.3) / baseH, 1)
      drawCropToCanvas(img, sel, transform, el, { width: baseW * scale, height: baseH * scale })
    },
    // post：等待 v-if 切换后画布元素完成挂载
    { flush: 'post', immediate: true }
  )
}
