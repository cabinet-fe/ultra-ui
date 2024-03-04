import type { CSSProperties } from 'vue'

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
      el.attributeStyleMap.set(key, String(styles[key]))
    })
  } else {
    Object.keys(styles).forEach(key => {
      el.style[key] = String(styles[key])
    })
  }
}
