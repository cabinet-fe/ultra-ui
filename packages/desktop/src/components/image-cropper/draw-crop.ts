import type { ImageCropperResult } from '../../types'
import type { SelectionRect } from './use-selection'

/** 影响裁剪输出的变换（缩放 / 平移只影响画布展示，与输出无关） */
export interface CropTransform {
  /** 90° 步进角度：0 / 90 / 180 / 270 */
  rotation: number
  flipX: boolean
  flipY: boolean
}

/** 输出尺寸，缺省维度按选区比例推算，都不传则为原图选区像素尺寸 */
export interface CropOutputSize {
  width?: number
  height?: number
}

/**
 * 把选区按当前旋转 / 翻转变换绘制到目标 canvas，预览（P4）与 getResult()（P5）共用。
 * 输出为屏幕上看到的裁剪结果：先旋转后翻转，与舞台 transform 链一致
 */
export function drawCropToCanvas(
  img: HTMLImageElement,
  selection: SelectionRect,
  transform: CropTransform,
  canvas: HTMLCanvasElement,
  outSize?: CropOutputSize
): void {
  const { rotation, flipX, flipY } = transform
  // 旋转 90° / 270° 后输出的宽为选区高、高为选区宽
  const swapped = rotation % 180 !== 0
  const baseW = swapped ? selection.height : selection.width
  const baseH = swapped ? selection.width : selection.height

  const outW = Math.max(
    1,
    Math.round(outSize?.width ?? ((outSize?.height ?? baseH) / baseH) * baseW)
  )
  const outH = Math.max(
    1,
    Math.round(outSize?.height ?? ((outSize?.width ?? baseW) / baseW) * baseH)
  )
  canvas.width = outW
  canvas.height = outH

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.translate(outW / 2, outH / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.scale(((flipX ? -1 : 1) * outW) / baseW, ((flipY ? -1 : 1) * outH) / baseH)
  // 以画布中心为锚绘制选区，旋转 / 翻转由上面的变换承担
  ctx.drawImage(
    img,
    selection.x,
    selection.y,
    selection.width,
    selection.height,
    -selection.width / 2,
    -selection.height / 2,
    selection.width,
    selection.height
  )
}

/**
 * canvas 导出为 Blob。
 * 跨域图片污染画布时 toBlob 同步抛 SecurityError，包装为可捕获的 Promise 拒绝
 */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Export crop result failed: canvas.toBlob got null'))
      }, 'image/png')
    } catch (err) {
      reject(
        new Error('Export crop result failed: canvas is tainted by cross-origin image', {
          cause: err
        })
      )
    }
  })
}

/** Blob 读取为 dataURL 形式的 base64 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () =>
      reject(reader.error ?? new Error('Export crop result failed: read blob as base64 failed'))
    reader.readAsDataURL(blob)
  })
}

/**
 * 输出选区裁剪结果：离屏 canvas 经 drawCropToCanvas 按原图像素绘制后导出 Blob + base64。
 * outSize 缺省为原图选区像素尺寸，传入则按该尺寸缩放输出
 */
export async function cropToResult(
  img: HTMLImageElement,
  selection: SelectionRect,
  transform: CropTransform,
  outSize?: CropOutputSize
): Promise<ImageCropperResult> {
  const canvas = document.createElement('canvas')
  drawCropToCanvas(img, selection, transform, canvas, outSize)
  const blob = await canvasToBlob(canvas)
  return { blob, base64: await blobToBase64(blob) }
}
