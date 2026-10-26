import type { FormComponentProps } from '@veltra/utils'

/** 上传文件项（url 可为本地 blob 地址或已上传地址） */
export interface UploaderFileItem {
  /** 文件访问地址（本地预览为 blob: 地址；上传失败时为空） */
  url: string
  /** 文件名（用于类型识别与展示，回显历史数据时建议必传） */
  name?: string
  /** 文件大小（字节） */
  size?: number
  /** 上传状态：传入 upload 时未完成前为 uploading，失败为 failed */
  status?: 'uploading' | 'done' | 'failed'
}

/** 上传组件属性（报销填报场景：图片 / word / excel / pdf） */
export interface UploaderProps extends FormComponentProps {
  /** 文件列表（v-model） */
  modelValue?: UploaderFileItem[]
  /** 接受的文件类型，透传原生 input accept */
  accept?: string
  /** 是否多选 */
  multiple?: boolean
  /** 最大文件数量，超出后隐藏上传入口 */
  maxCount?: number
  /** 单文件大小上限（字节），超出触发 oversize 并丢弃 */
  maxSize?: number
  /**
   * 是否显示删除按钮；传函数可按文件控制（返回 false 隐藏该文件的删除按钮，如补传模式仅允许删补传附件）。
   * 注意联合类型须函数成员在前，否则 defineProps 宏推导运行时类型时会丢失 Function
   */
  deletable?: ((file: UploaderFileItem, index: number) => boolean) | boolean
  /** 点击图片是否打开内置大图预览；文档类型始终只派发 click-file */
  preview?: boolean
  /** 自定义上传，返回文件地址；不传则本地 blob 地址直显 */
  upload?: (file: File) => Promise<string>
  /** 读取文件前校验，返回 false（或 resolve false）阻止添加 */
  beforeRead?: (file: File) => boolean | Promise<boolean>
}

/** 上传组件定义的事件 */
export interface UploaderEmits {
  (e: 'update:modelValue', files: UploaderFileItem[]): void
  (e: 'change', files: UploaderFileItem[]): void
  (e: 'oversize', files: File[]): void
  (e: 'delete', file: UploaderFileItem, index: number): void
  (e: 'click-file', file: UploaderFileItem, index: number): void
}

/** 上传组件暴露的对象 */
export interface UploaderExposed {}
