/** 走马灯组件属性 */
export interface CarouselProps {
  /** 当前页索引，从 0 开始，v-model:active-index 双向绑定，默认 0 */
  activeIndex?: number

  /** 是否自动播放，默认 false */
  autoplay?: boolean

  /** 自动播放间隔（毫秒），默认 3000 */
  interval?: number

  /** 是否循环：末页向后回到首页、首页向前回到末页，默认 true */
  loop?: boolean

  /** 是否显示前后切换箭头，默认 false */
  arrows?: boolean

  /** 是否显示指示器圆点，默认 true */
  dots?: boolean
}

/** 走马灯组件定义的事件 */
export interface CarouselEmits {
  (e: 'update:activeIndex', index: number): void
  (e: 'change', current: number, prev: number): void
}

/** 走马灯单页组件属性：页内容经默认插槽渲染，暂无配置项 */
export interface CarouselItemProps {}
