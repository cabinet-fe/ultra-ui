import type { DeconstructValue } from '@veltra/utils'

/** 图片裁剪组件属性 */
export interface ImageCropperProps {
  /** 图片源：File / Blob / URL */
  src?: File | Blob | string
  /** 选区宽高比，不传为自由比例 */
  aspectRatio?: number
  /** 是否显示工具栏 */
  showToolbar?: boolean
  /** 是否显示预览区 */
  showPreview?: boolean
}

/** 图片裁剪组件定义的事件 */
export interface ImageCropperEmits {}

/** 图片裁剪组件暴露的属性和方法(组件内部使用) */
export interface _ImageCropperExposed {}

/** 图片裁剪组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ImageCropperExposed = DeconstructValue<_ImageCropperExposed>
