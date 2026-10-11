import type { DeconstructValue } from '@veltra/utils'

/** 图片预览源：URL（支持 http(s):、blob:、data:）或二进制原始数据 */
export type ImagePreviewerSource = string | File | Blob | ArrayBuffer | Uint8Array

/** 图片预览组件属性 */
export interface ImagePreviewerProps {
  /** 图片源；切换时重置缩放并回收上一张的 objectURL */
  src?: ImagePreviewerSource
  /** 图片 alt 文本（无障碍与加载失败回退），缺省为「图片预览」 */
  alt?: string
  /** 二进制源（ArrayBuffer / Uint8Array）的 MIME 类型提示，仅用于 objectURL 构造 */
  mime?: string
  /**
   * lightbox 模式开关，默认 true：Teleport 到 body 的全屏遮罩，内置关闭按钮、
   * Esc 关闭与缩放工具。false 时内嵌渲染纯预览面（无遮罩与关闭），供
   * file-viewer 等宿主嵌入自己的框架，缩放经 expose 方法 / 滚轮 / 双击驱动
   */
  modal?: boolean
  /** lightbox 显隐（支持 v-model:open），缺省 true */
  open?: boolean
  /** lightbox 模式点击图片外区域是否关闭，默认 true */
  closeOnClickBackdrop?: boolean
  /** lightbox 模式按 Esc 是否关闭，默认 true */
  closeOnEsc?: boolean
}

/** 图片预览组件事件 */
export interface ImagePreviewerEmits {
  (e: 'update:open', value: boolean): void
  /** lightbox 关闭时触发（关闭按钮 / Esc / 点击图片外区域） */
  (e: 'close'): void
  /** 缩放级别变化（工具按钮 / 滚轮 / 双击 / expose 方法） */
  (e: 'zoom-change', level: number): void
  /** 图片加载失败 */
  (e: 'error', err: unknown): void
}

/** 图片预览组件暴露的属性和方法(组件内部使用) */
export interface _ImagePreviewerExposed {
  /** 放大一级（ZOOM_STEP 步进，收敛在 [ZOOM_MIN, ZOOM_MAX]） */
  zoomIn: () => void
  /** 缩小一级 */
  zoomOut: () => void
  /** 重置到 100%（平移偏移一并归零） */
  resetZoom: () => void
}

/** 图片预览组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ImagePreviewerExposed = DeconstructValue<_ImagePreviewerExposed>
