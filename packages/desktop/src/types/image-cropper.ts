import type { DeconstructValue } from '@veltra/utils'

export interface ImageCropperProps {
  src?: File | Blob | string
  /** 选区宽高比，不传为自由比例 */
  aspectRatio?: number
  showToolbar?: boolean
  showPreview?: boolean
}

/** getResult 输出尺寸：缺省维度按选区比例推算，都不传则为原图选区像素尺寸 */
export interface ImageCropperResultOptions {
  width?: number
  height?: number
}

export interface ImageCropperResult {
  /** 裁剪图像 Blob（image/png） */
  blob: Blob
  /** 裁剪图像的 dataURL（data:image/png;base64,...），可直接用于 img.src */
  base64: string
}

/** 裁剪选区（图片像素坐标） */
export interface ImageCropperSelection {
  x: number
  y: number
  width: number
  height: number
}

/** 影响裁剪输出的图片变换（缩放 / 平移只影响画布展示，不在其列） */
export interface ImageCropperCropTransform {
  /** 90° 步进角度：0 / 90 / 180 / 270 */
  rotation: number
  flipX: boolean
  flipY: boolean
}

export interface ImageCropperChangePayload {
  selection: ImageCropperSelection
  /** 影响输出的图片变换摘要，与 getResult 应用的一致 */
  transform: ImageCropperCropTransform
}

export interface ImageCropperEmits {
  /** 选区或图片变换变化时触发 */
  (e: 'crop-change', payload: ImageCropperChangePayload): void
}

export interface _ImageCropperExposed {
  /**
   * 输出当前选区裁剪结果：默认按原图选区像素，可传目标宽 / 高缩放输出。
   * 图片未加载 / 无选区、或跨域图片污染画布时 Promise 拒绝，不静默失败
   */
  getResult: (options?: ImageCropperResultOptions) => Promise<ImageCropperResult>
}

/** 图片裁剪组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ImageCropperExposed = DeconstructValue<_ImageCropperExposed>
