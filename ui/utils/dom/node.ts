import type { CSSProperties } from 'vue'
import { addClass } from './class-name'
import { setStyles } from './style'

/**
 * 创建一个元素
 * @param tag 元素标签
 * @param props 元素属性
 * @returns 元素
 */
export function createEl(
  tag: string,
  props: {
    className?: string | string[]
    styles?: CSSProperties
    [key: string]: any
  },
  children?: HTMLElement | HTMLElement[]
) {
  const el = document.createElement(tag)
  const { class: className, styles, ...rest } = props

  if (className) {
    addClass(el, className)
  }

  if (styles) {
    setStyles(el, styles)
  }

  Object.entries(rest).forEach(([key, value]) => {
    el[key] = value
  })

  if (children) {
    if (Array.isArray(children)) {
      children.forEach(child => el.appendChild(child))
    } else {
      el.appendChild(children)
    }
  }

  return el
}
