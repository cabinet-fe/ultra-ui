import type { CSSProperties } from 'vue'
import { kebabCase } from 'cat-kit/fe'

/**
 * 给数值加上单位
 * @param value 数值
 * @param unit 单位
 * @returns
 */
export function withUnit(value: number | string | undefined, unit: string) {
  return value === undefined
    ? undefined
    : typeof value === 'number' || !isNaN(+value)
      ? String(value) + unit
      : value
}

/**
 * 设置元素样式，优先使用高性能的方式
 * @param el 元素
 * @param styles 样式
 */
export function setStyles(el: HTMLElement, styles: CSSProperties) {
  if (el.attributeStyleMap) {
    Object.keys(styles).forEach(key => {
      const value = styles[key]
      if (!value && value !== 0) {
        el.attributeStyleMap.delete(kebabCase(key))
      } else {
        el.attributeStyleMap.set(kebabCase(key), value)
      }
    })
  } else {
    Object.keys(styles).forEach(key => {
      el.style[key] = styles[key]
    })
  }
}

/**
 * 移除样式
 * @param el dom元素
 * @param props 要移除的样式属性
 */
export function removeStyles(el: HTMLElement, props: string[]) {
  if (el.attributeStyleMap) {
    props.forEach(key => {
      el.attributeStyleMap.delete(kebabCase(key))
    })
  } else {
    props.forEach(key => {
      el.style.removeProperty(key)
    })
  }
}
