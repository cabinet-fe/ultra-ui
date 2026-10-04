import type { ComponentProps } from '@veltra/utils'

/** 描述列表布局：horizontal 键值同行 / vertical 键值分行 */
export type DescriptionsLayout = 'horizontal' | 'vertical'

/** 描述列表组件属性 */
export interface DescriptionsProps extends ComponentProps {
  /** 列表标题，渲染在列表顶部 */
  title?: string
  /** 每行展示的键值对列数，默认 3 */
  column?: number
  /** 边框模式：键值单元格带描边与键名底色，默认 false（无边框） */
  border?: boolean
  /** 布局方向，默认 'horizontal' */
  layout?: DescriptionsLayout
}

/** 描述列表项组件属性 */
export interface DescriptionsItemProps {
  /** 键名文本 */
  label?: string
}
