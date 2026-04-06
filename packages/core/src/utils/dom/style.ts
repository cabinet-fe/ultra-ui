import type { CSSProperties } from 'vue'
import { str } from '@cat-kit/core'

/**
 * 给数值加上单位
 * @param value 数值
 * @param unit 单位
 * @returns
 */
export function withUnit(
  value: number | string | undefined,
  unit: string
): string | undefined {
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
export function setStyles(el: HTMLElement, styles: CSSProperties): void {
  Object.keys(styles).forEach(key => {
    el.style[key] = styles[key]
  })
  // TODO: 此处有问题，在某些情况下会导致样式设置失效
  // 例如在 Tabs 组件中无法设置overflow属性
  // if (el.attributeStyleMap) {
  //   Object.keys(styles).forEach(key => {
  //     const value = styles[key]
  //     if (!value && value !== 0) {
  //       el.attributeStyleMap.delete(str(key).kebabCase())
  //     } else {
  //       el.attributeStyleMap.set(str(key).kebabCase(), value)
  //     }
  //   })
  // } else {
  //   Object.keys(styles).forEach(key => {
  //     el.style[key] = styles[key]
  //   })
  // }
}

/**
 * 移除样式
 * @param el dom元素
 * @param props 要移除的样式属性
 */
export function removeStyles(el: HTMLElement, props: string[]): void {
  if (el.attributeStyleMap) {
    props.forEach(key => {
      el.attributeStyleMap.delete(str(key).kebabCase())
    })
  } else {
    props.forEach(key => {
      el.style.removeProperty(key)
    })
  }
}
