import { str } from '@cat-kit/core'
import type { CSSProperties } from 'vue'

export function withUnit(value: number | string | undefined, unit: string): string | undefined {
  return value === undefined
    ? undefined
    : typeof value === 'number' || !isNaN(+value)
      ? String(value) + unit
      : value
}

export function setStyles(el: HTMLElement, styles: CSSProperties): void {
  Object.keys(styles).forEach((key) => {
    el.style[key] = styles[key]
  })
  // TODO: 此处有问题，在某些情况下会导致样式设置失效
  // 例如在 Tabs 组件中无法设置overflow属性
}

export function removeStyles(el: HTMLElement, props: string[]): void {
  if (el.attributeStyleMap) {
    props.forEach((key) => {
      el.attributeStyleMap.delete(str(key).kebabCase())
    })
  } else {
    props.forEach((key) => {
      el.style.removeProperty(key)
    })
  }
}
