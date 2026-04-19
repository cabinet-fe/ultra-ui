import type { DeconstructValue } from '@veltra/utils'
import type { ShallowRef } from 'vue'

/** 预览器类别：xlsx 与 csv 归一为 sheet */
export type FileViewerKind = 'image' | 'video' | 'pdf' | 'sheet' | 'docx' | 'text'

/** 单个预览文件定义 */
export interface FileViewerItem {
  /** 唯一 id；未提供时组件内部按索引生成 */
  id?: string
  /** 展示名（通常为原始文件名） */
  name: string
  /**
   * 文件源：
   * - string: URL（支持 http(s):、blob:、data:）
   * - File / Blob / ArrayBuffer / Uint8Array: 二进制原始数据
   */
  src: string | File | Blob | ArrayBuffer | Uint8Array
  /** 类型；缺省时根据 name 后缀推断 */
  kind?: FileViewerKind
  /** MIME type，仅用于原生 <video> / <img> / 下载时的类型提示 */
  mime?: string
  /** 文件大小（字节），可选，仅用于侧栏展示 */
  size?: number
}

/** 文件预览组件属性 */
export interface FileViewerProps {
  /** 待预览的文件列表 */
  files: FileViewerItem[]
  /** 当前激活文件 id（配合 v-model） */
  modelValue?: string
  /** 侧栏宽度（CSS length 或 false 隐藏侧栏），默认 280px */
  sidebarWidth?: string | number | false
  /** sheet 场景单文件最大渲染行数，默认 50000；0 表示不截断 */
  sheetMaxRows?: number
  /** 是否显示下载按钮，默认 true */
  downloadable?: boolean
  /**
   * 全屏模态模式开关（支持 v-model:open）。
   *
   * - `undefined`（缺省）：内嵌模式，组件在原位置渲染
   * - `true` / `false`：进入模态模式，Teleport 到 body，按本值控制显隐
   */
  open?: boolean
  /** 模态模式下点击背景是否关闭，默认 true */
  closeOnClickBackdrop?: boolean
  /** 模态模式下按 ESC 是否关闭，默认 true */
  closeOnEsc?: boolean
}

/** 文件预览组件事件 */
export interface FileViewerEmits {
  (e: 'update:modelValue', id: string): void
  (e: 'update:open', value: boolean): void
  (e: 'change', file: FileViewerItem): void
  (e: 'error', err: { file: FileViewerItem; error: unknown }): void
}

/** 文件预览组件暴露的属性和方法(组件内部使用) */
export interface _FileViewerExposed {
  activeId: ShallowRef<string | undefined>
  activate: (id: string) => void
  next: () => void
  prev: () => void
}

/** 文件预览组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type FileViewerExposed = DeconstructValue<_FileViewerExposed>
