export interface SkeletonProps {
  /** 是否处于加载态；false 时渲染默认插槽的实际内容，默认 true */
  loading?: boolean

  /** 默认 false */
  avatar?: boolean

  /** 默认 true */
  title?: boolean

  /** 默认 true */
  paragraph?: boolean

  /** 默认 3 */
  rows?: number

  /** 默认 false */
  button?: boolean

  /** 是否使用胶囊圆角，作用于标题 / 段落 / 按钮占位块，默认 false */
  round?: boolean

  /** 默认 false */
  animated?: boolean
}

export interface SkeletonEmits {}
