export interface SkeletonProps {
  /** 是否处于加载态；false 时渲染默认插槽的实际内容，默认 true */
  loading?: boolean

  avatar?: boolean

  /** 是否显示标题占位块，默认 true */
  title?: boolean

  /** 是否显示段落占位块，默认 true */
  paragraph?: boolean

  /** 段落占位块行数，默认 3 */
  rows?: number

  button?: boolean

  /** 是否使用胶囊圆角，作用于标题 / 段落 / 按钮占位块，默认 false */
  round?: boolean

  /** 是否开启呼吸动画，默认 false */
  animated?: boolean
}

export interface SkeletonEmits {}
