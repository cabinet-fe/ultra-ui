# @veltra/utils — DOM

```typescript
import { makeBEM, type BEMFactory } from '../helper/make-bem'
import { CLS_PREFIX } from '../shared/constants'

export const bem: BEMFactory<typeof CLS_PREFIX> = makeBEM(CLS_PREFIX)

export function addClass(el: HTMLElement, className: string | string[]): void {
  if (Array.isArray(className)) {
    className.forEach((c) => el.classList.add(c))
  } else {
    el.classList.add(className)
  }
}

export function removeClass(el: HTMLElement, className: string | string[]): void {
  if (Array.isArray(className)) {
    className.forEach((c) => el.classList.remove(c))
  } else {
    el.classList.remove(className)
  }
}
```

---

```typescript
// TODO: 在多种场景下, 比较KMP算法, BM算法, two-way算法是否比正则更快

interface HighlightChunk {
  text: string
  highlight: boolean
}

const escapeRegexp = (term: string): string =>
  term.replace(/[|\\{}()[\]^$+*?.-]/g, (char: string) => `\\${char}`)

/**
 * 获取文本高亮片段
 * @param string 字符串
 * @param substrings 需要匹配的字串列表
 */
export function getHighlightChunks(str: string, substrings: string[]): HighlightChunk[] {
  const _substrings = substrings.filter((s) => !!s).map((s) => escapeRegexp(s.trim()))
  const re = new RegExp(`(${_substrings.join('|')})`, 'gi')
  return str
    .split(re)
    .filter(Boolean)
    .map((text) => ({ text, highlight: re.test(text) }))
}
```

---

```typescript
/**
 * 获取可滚动的父级
 * @param el 元素
 * @returns
 */
export function getScrollParents(el: HTMLElement): HTMLElement[] {
  const parents: HTMLElement[] = []
  let parent = el.parentElement
  while (parent) {
    if (parent.scrollHeight > parent.clientHeight) {
      parents.push(parent)
    }

    parent = parent.parentElement
  }
  return parents
}

/**
 * 获取最近的可滚动父级
 * @param el 元素
 * @returns 最近的可滚动父级
 */
export function getNearestScrollParent(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement
  while (parent) {
    if (parent.scrollHeight > parent.clientHeight) {
      return parent
    }
    parent = parent.parentElement
  }
  return null
}

type ScrollViewPosition = 'center' | 'start' | 'end'

/**
 * 滚动元素到容器视图中
 * @description 用于替代 `el.scrollIntoView` 方法，因为 `el.scrollIntoView` 在某些情况下会导致外部元素滚动
 * @param el 元素
 * @param container 可滚动容器
 * @param options 滚动选项
 */
export function scrollIntoContainerView(
  el: HTMLElement,
  container: HTMLElement | null,
  options?: { block?: ScrollViewPosition; inline?: ScrollViewPosition }
): void {
  container = container || getNearestScrollParent(el)
  if (!container) return

  const { block = 'center', inline = 'center' } = options || {}

  const {
    offsetTop: eOffsetTop,
    offsetLeft: eOffsetLeft,
    offsetHeight: eOffsetHeight,
    offsetWidth: eOffsetWidth
  } = el

  const {
    clientHeight: cClientHeight,
    clientWidth: cClientWidth,
    scrollTop: cScrollTop,
    scrollLeft: cScrollLeft
  } = container

  const isVerticalInView =
    cScrollTop + cClientHeight > eOffsetTop + eOffsetHeight && cScrollTop < eOffsetTop

  const isHorizontalInView =
    cScrollLeft + cClientWidth > eOffsetLeft + eOffsetWidth && cScrollLeft < eOffsetLeft

  // 垂直方向和水平方向都已经在视图中，则不进行滚动
  if (isVerticalInView && isHorizontalInView) return

  if (!isVerticalInView) {
    if (block === 'center') {
      container.scrollTop = eOffsetTop - cClientHeight / 2 + eOffsetHeight / 2
    } else if (block === 'start') {
      container.scrollTop = eOffsetTop
    } else if (block === 'end') {
      container.scrollTop = eOffsetTop - cClientHeight + eOffsetHeight
    }
  }

  if (!isHorizontalInView) {
    if (inline === 'center') {
      container.scrollLeft = eOffsetLeft - cClientWidth / 2 + eOffsetWidth / 2
    } else if (inline === 'start') {
      container.scrollLeft = eOffsetLeft
    } else if (inline === 'end') {
      container.scrollLeft = eOffsetLeft - cClientWidth + eOffsetWidth
    }
  }
}
```

---

```typescript
import { str } from '@cat-kit/core'
import type { CSSProperties } from 'vue'

/**
 * 给数值加上单位
 * @param value 数值
 * @param unit 单位
 * @returns
 */
export function withUnit(value: number | string | undefined, unit: string): string | undefined {
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
  Object.keys(styles).forEach((key) => {
    el.style[key] = styles[key]
  })
  // TODO: 此处有问题，在某些情况下会导致样式设置失效
  // 例如在 Tabs 组件中无法设置overflow属性
  // if (el.attributeStyleMap) {
  //   Object.keys(styles).forEach(key => {
  //     const value = styles[key]
  //     if (!value && value !== 0) {
  //       el.attributeStyleMap.delete(kebabCase(key))
  //     } else {
  //       el.attributeStyleMap.set(kebabCase(key), value)
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
    props.forEach((key) => {
      el.attributeStyleMap.delete(str(key).kebabCase())
    })
  } else {
    props.forEach((key) => {
      el.style.removeProperty(key)
    })
  }
}
```

---

```typescript
import { createIncrease } from '../helper/create-increase'

/**
 * z轴层级
 * 保证每个新打开的弹框的位置都处于上层
 */
export const zIndex: () => number = createIncrease(1000)
```
