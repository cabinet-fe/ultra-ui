# @veltra/utils — 源码镜像（工具与 DOM 等）


> 由 `skills/veltra-utils/scripts/sync-docs.ts` 自 `packages/utils/src/` 生成（不含 `shared/`、`types/`，见 `shared-types.md`）。

## 包入口

### `index.ts`

```typescript
// 来源: packages/utils/src/index.ts
export * from './dom/class-name'

export * from './dom/highlight'

export * from './dom/position'

export * from './dom/style'

export * from './dom/z-index'

export * from './form/validate'

export * from './helper/create-increase'

export * from './helper/create-toggle'

export * from './helper/tween'

export * from './helper/frame'

export * from './helper/make-bem'

export * from './helper/vue'

export * from './reactive/proxy'

export * from './shared'
export * from './types'
```

## DOM

### `dom/class-name.ts`

```typescript
// 来源: packages/utils/src/dom/class-name.ts
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

### `dom/highlight.ts`

```typescript
// 来源: packages/utils/src/dom/highlight.ts
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

### `dom/position.ts`

```typescript
// 来源: packages/utils/src/dom/position.ts
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

### `dom/style.ts`

```typescript
// 来源: packages/utils/src/dom/style.ts
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

### `dom/z-index.ts`

```typescript
// 来源: packages/utils/src/dom/z-index.ts
import { createIncrease } from '../helper/create-increase'

/**
 * z轴层级
 * 保证每个新打开的弹框的位置都处于上层
 */
export const zIndex: () => number = createIncrease(1000)
```

## 表单校验

### `form/validate.ts`

```typescript
// 来源: packages/utils/src/form/validate.ts
import { o } from '@cat-kit/core'

import type { Undef } from '../types/helper'
import type { ValidateRule, Data, ValidatorConfig, PresetRule } from '../types/utils/form/validate'

const isEmpty = (value: any): value is null | undefined => {
  return value === null || value === undefined
}

const presetRules: Record<PresetRule, (value: string) => string | undefined> = {
  email(v) {
    const re = /^([\w_-]+)@([\w-]+[.]?)*[\w]+\.[a-zA-Z]{2,10}$/
    if (!re.test(v)) {
      return '邮箱格式不正确'
    }
  },
  phone(v) {
    const re = /^\d{11}$/
    if (!re.test(v)) {
      return '手机号格式不正确'
    }
  },
  num(v) {
    const re = /^\d+$/
    if (!re.test(v)) {
      return '数字格式不正确'
    }
  },
  url(v) {
    const re = /^(ftp|https?):\/\/([\w_-]+)\.([\w-]+[.]?)*[\w]+\.[a-zA-Z]{2,10}(.*)/
    if (!re.test(v)) {
      return '链接格式不正确'
    }
  },

  idCard(v) {
    const re = /^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/
    if (!re.test(v)) {
      return '身份证格式不正确'
    }
  }
}

/** 预设规则 */
const ruleTypes = {
  required(value: any, required: ValidateRule['required']): Undef<string> {
    if (required === false) return

    const errMsg = typeof required === 'string' ? required : '该项不能为空'
    if (isEmpty(value)) return errMsg

    if (Array.isArray(value) && !value.length) return errMsg
    if (typeof value === 'string' && !value) return errMsg
  },
  min(value: any, rule: ValidateRule['min']): Undef<string> {
    if (isEmpty(value)) return
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项必须大于等于${_rule}`
    if (typeof value !== 'number') return `${value}不是一个数字`
    if (value < _rule) return errMsg
  },
  max(value: any, rule: ValidateRule['max']): Undef<string> {
    if (isEmpty(value)) return
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项必须小于等于${_rule}`
    if (typeof value !== 'number') return `${value}不是一个数字`
    if (value > _rule) return errMsg
  },

  minLen(value: any, rule: ValidateRule['minLen']): Undef<string> {
    if (isEmpty(value)) return
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项长度必须大于等于${_rule}`
    if (!Array.isArray(value) && typeof value !== 'string') return `${value}不是一个字符串或数组`
    if (value.length < _rule) return errMsg
  },
  maxLen(value: any, rule: ValidateRule['maxLen']): Undef<string> {
    if (isEmpty(value)) return
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项长度必须小于等于:${_rule}`
    if (!Array.isArray(value) && typeof value !== 'string') return `${value}不是一个字符串或数组`
    if (value.length > _rule) return errMsg
  },
  match(value: any, rule: ValidateRule['match']): Undef<string> {
    if (isEmpty(value) || value === '') return
    if (typeof rule === 'string') {
      if (!rule) return
      rule = new RegExp(rule)
    }
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项不匹配正则:${_rule}`
    if (typeof value !== 'string') return `${value}不是一个字符串`
    if (!_rule.test(value)) return errMsg
  },
  preset(value: any, rule: ValidateRule['preset']): Undef<string> {
    if (isEmpty(value) || value === '' || !rule) return
    if (typeof value !== 'string') return `${value}不是一个字符串`
    const ruleValidator = presetRules[rule]
    return ruleValidator(value)
  }
}
/**  */
export class Validator<
  Rules extends Record<string, ValidateRule> = Record<string, ValidateRule>,
  Field extends keyof Rules = keyof Rules
> {
  protected rules: Rules

  private config?: ValidatorConfig

  constructor(rules: Rules, config?: ValidatorConfig) {
    this.rules = rules
    if (config) {
      this.config = config
    }
  }

  /** 是否存在规则 */
  private get existRules() {
    for (const _ in this.rules) {
      return true
    }
    return false
  }

  /**
   * 校验单条数据
   * @param data 数据
   */
  private async validateSingleData(
    data: Record<any, any>,
    fields?: Field | Field[]
  ): Promise<{ [key in Field]?: string[] }> {
    const fieldErrors: { [key in Field]?: string[] } = {}

    if (!this.existRules) return fieldErrors

    const lazy = this.config?.lazy ?? true

    fields = fields
      ? Array.isArray(fields)
        ? fields
        : [fields]
      : (Object.keys(this.rules) as Field[])

    // 懒校验，当有一个规则不通过，剩下的规则不再校验
    if (lazy) {
      // 校验字段
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i]!
        // oxlint-disable-next-line eslint(no-await-in-loop)
        const errors = await this.validateValueLazy(data, field)
        if (errors.length === 0) continue
        fieldErrors[field] = errors
      }
      return fieldErrors
    } else {
      // 校验字段
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i]!
        // oxlint-disable-next-line eslint(no-await-in-loop)
        const errors = await this.validateValue(data, field)
        if (errors.length === 0) continue
        fieldErrors[field] = errors
      }

      return fieldErrors
    }
  }

  private async validateValue(data: Record<any, any>, field: Field) {
    const rules = this.rules[field]!
    const value = o(data).get(field as string)

    const { validator, required, ...normalRules } = rules

    let errors: string[] = []

    // 必填要先去校验
    if (required) {
      const err = ruleTypes.required(value, required)
      err && errors.push(err)
    }

    // 校验规则
    for (const ruleKey in normalRules) {
      const validate = ruleTypes[ruleKey]
      if (!validate) continue
      const err = validate(value, normalRules[ruleKey])
      err && errors.push(err)
    }

    // 自定义校验
    if (validator) {
      const err = await validator(value, data)
      err && errors.push(err)
    }

    return errors
  }

  private async validateValueLazy(data: Record<any, any>, field: Field): Promise<string[]> {
    const rules = this.rules[field]
    const value = o(data).get(field as string)
    let errors: string[] = []

    if (!rules) return errors

    const { validator, required, ...normalRules } = rules

    // 必填要先去校验
    if (required) {
      const err = ruleTypes.required(value, required)
      if (err) {
        errors.push(err)
        return errors
      }
    }

    // 校验规则
    for (const ruleKey in normalRules) {
      const validate = ruleTypes[ruleKey]
      if (!validate) continue

      const err = validate(value, normalRules[ruleKey])

      if (err) {
        errors.push(err)
        return errors
      }
    }

    // 自定义校验最火校验
    if (validator) {
      const err = await validator(value, data)
      if (err) {
        errors.push(err)
        return errors
      }
    }

    return errors
  }

  /**
   * 校验多条数据
   * @param field 需要校验的字段
   */
  private async validateManyData(
    data: Data,
    field?: Field | Field[]
  ): Promise<{ [key in Field]?: string[] }> {
    let i = 0
    while (i < data.length) {
      const item = data[i]!
      // oxlint-disable-next-line eslint(no-await-in-loop)
      const fieldErrors = await this.validateSingleData(item, field)
      if (Object.keys(fieldErrors).length > 0) {
        return fieldErrors
      }
      i++
    }

    return {}
  }

  /**
   * 校验
   * @param data 数据
   * @param fields 字段
   * @returns
   */
  async validate(data: Data, fields?: Field | Field[]): Promise<{ [key in Field]?: string[] }> {
    return Array.isArray(data)
      ? this.validateManyData(data, fields)
      : this.validateSingleData(data, fields)
  }
}
```

## 辅助

### `helper/create-increase.ts`

```typescript
// 来源: packages/utils/src/helper/create-increase.ts
/**
 * 创建一个自增函数
 * @param initial 初始值
 * @returns
 */
export function createIncrease(initial = 1000): () => number {
  let value = initial

  const increase = () => {
    return value++
  }

  return increase
}
```

### `helper/create-toggle.ts`

```typescript
// 来源: packages/utils/src/helper/create-toggle.ts
type Active = boolean | ((active: boolean) => boolean) | ((active: boolean) => Promise<boolean>)

type ToggleReturn = [{ value: boolean }, (active: Active) => void]
/**
 * 创建一个toggle函数
 * @param initial 初始值
 * @param onChange 值变化时的回调
 * @returns
 */
export function createToggle(initial = false, onChange?: (active: boolean) => void): ToggleReturn {
  const state = { value: initial }

  function toggle(active: Active) {
    if (typeof active === 'boolean') {
      state.value = active
      return onChange?.(state.value)
    }

    const result = active(state.value)

    if (result instanceof Promise) {
      result.then(toggle)
    } else {
      toggle(result)
    }
  }

  return [state, toggle]
}
```

### `helper/frame.ts`

```typescript
// 来源: packages/utils/src/helper/frame.ts
/**
 * 下一帧运行
 * @param cb 回调
 */
export function nextFrame(cb: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb)
  })
}
```

### `helper/make-bem.ts`

```typescript
// 来源: packages/utils/src/helper/make-bem.ts
/** BEM实例 */
export type BEM<N extends string, P extends string = 'u-', B extends string = `${P}${N}`> = {
  /** BEM中的块 */
  b: B

  /**
   * BEM中的元素(E)
   * @param name 元素名称
   * @returns
   */
  e<const E extends string>(name: E): `${B}__${E}`

  /**
   * 基于当前bem创建一个新的bem
   * @param block 块名称
   */
  create<const Block extends string>(block: Block): BEM<`${N}-${Block}`, P>

  /**
   * BEM中的修饰符(M)
   * @param m 修饰符名
   * @returns 修饰符
   */
  m<const M extends string>(m: M): `${B}--${M}`

  /**
   * BEM中的元素与修饰符(E--M)
   * @param e 元素名
   * @param m 修饰符名
   * @returns
   */
  em<const E extends string, const M extends string>(e: E, m: M): `${B}__${E}--${M}`
}

/** BEM工厂 */
export interface BEMFactory<Prefix extends string> {
  <N extends string>(name: N): BEM<N, Prefix>
  /**
   * 生成is辅助类
   * @param name 辅助类名称
   */
  is<const N extends string>(name: N): `is-${N}`
  /**
   * 生成is辅助类
   * @param name 辅助类名称
   * @param condition 辅助类显示条件
   */
  is<const N extends string, C extends boolean | undefined>(
    name: N,
    condition: C
  ): C extends true ? `is-${N}` : ''
}

/**
 * 创建一个bem函数
 * @param prefix 前缀
 */
export function makeBEM<Prefix extends '' | `${string}-`>(prefix: Prefix): BEMFactory<Prefix> {
  /**
   * css类命名辅助
   * @param name 类block名称
   */
  function bem<N extends string>(name: N): BEM<N, Prefix> {
    const b = `${prefix}${name}` as BEM<N, Prefix>['b']
    return {
      b,

      e(name) {
        return `${b}__${name}`
      },

      create(block) {
        return bem(`${name}-${block}`)
      },

      m(m) {
        return `${b}--${m}`
      },

      em(e, m) {
        return `${b}__${e}--${m}`
      }
    }
  }

  /**
   * 生成is辅助类
   * @param name 辅助类名称
   */
  function is<const N extends string>(name: N): `is-${N}`
  /**
   * 生成is辅助类
   * @param name 辅助类名称
   * @param condition 辅助类显示条件
   */
  function is<const N extends string, C extends boolean | undefined>(
    name: N,
    condition: C
  ): C extends true ? `is-${N}` : ''

  function is<N extends string>(name: N, condition?: boolean) {
    if (arguments.length < 2) return `is-${name}`
    return condition !== true ? '' : (`is-${name}` as const)
  }

  bem.is = is

  return bem
}
```

### `helper/tween.ts`

```typescript
// 来源: packages/utils/src/helper/tween.ts
/** 自 cat-kit 3.x Tween 行为对齐的轻量动画（原 `cat-kit/fe` 导出） */

export interface AnimeConfig<State extends Record<string, number>> {
  duration?: number
  easingFunction?: (progress: number) => number
  onComplete?(state: State): void
}

export interface TweenConfig<State extends Record<string, number>> {
  duration?: number
  onUpdate?(state: State): void
  onComplete?(state: State): void
  easingFunction?: (progress: number) => number
}

export class Tween<State extends Record<string, number> = Record<string, number>> {
  readonly state: State
  protected duration = 300
  protected onUpdate?: (state: State) => void
  protected onComplete?: (state: State) => void
  protected frameId?: number
  protected easingFunction: (progress: number) => number
  private defaultState: State

  constructor(state: State, config?: TweenConfig<State>) {
    this.state = state
    this.defaultState = { ...state }
    const { duration, onUpdate, onComplete, easingFunction } = config || {}
    if (duration !== undefined) this.duration = duration
    if (onUpdate !== undefined) this.onUpdate = onUpdate
    if (onComplete !== undefined) this.onComplete = onComplete
    this.easingFunction = easingFunction ?? Tween.easing.linear
  }

  protected raf(options: {
    onComplete: () => void
    duration: number
    tick: (p: number) => void
  }): void {
    const start = performance.now()
    const { onComplete, tick, duration } = options
    const update = (timestamp: number) => {
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      tick(progress)
      if (progress < 1) {
        this.frameId = requestAnimationFrame(update)
      } else {
        tick(progress)
        this.stop()
        onComplete()
      }
    }
    this.frameId = requestAnimationFrame(update)
  }

  to(state: Partial<State>, config?: AnimeConfig<State>): void {
    this.stop()
    const prevState = { ...this.state }
    const stateDistance = Object.keys(state).reduce(
      (acc, key) => {
        const k = key as keyof State
        const sv = state[k] as number
        const pv = prevState[k] as number
        if ((sv || sv === 0) && (pv || pv === 0)) {
          acc[key] = sv - pv
        }
        return acc
      },
      {} as Record<string, number>
    )
    const duration = config?.duration || this.duration
    const easingFunction = config?.easingFunction || this.easingFunction
    const onComplete = config?.onComplete || this.onComplete
    this.raf({
      duration,
      onComplete: () => {
        for (const key in state) {
          if (key in this.state) {
            ;(this.state as Record<string, number>)[key] = state[key as keyof State] as number
          }
        }
        this.onUpdate?.(this.state)
        onComplete?.(this.state)
      },
      tick: (progress) => {
        for (const key in stateDistance) {
          const pk = key as keyof State
          const target = (prevState[pk] as number) + easingFunction(progress) * stateDistance[key]!
          ;(this.state as Record<string, number>)[key] = target
        }
        this.onUpdate?.(this.state)
      }
    })
  }

  back(config?: AnimeConfig<State>): void {
    this.to(this.defaultState as Partial<State>, config)
  }

  private stop(): boolean {
    if (!this.frameId) return false
    cancelAnimationFrame(this.frameId)
    this.frameId = undefined
    return true
  }

  static readonly easing = {
    linear: (p: number) => p,
    easeInQuad: (p: number) => p * p,
    easeOutQuad: (p: number) => p * (2 - p),
    easeInOutQuad: (p: number) => (p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p),
    easeInBack: (p: number) => p * p * ((2.70158 + 1) * p - 1),
    easeOutBack: (p: number) => 1 + 2.70158 * Math.pow(p - 1, 3) + 1.70158 * Math.pow(p - 1, 2),
    easeInOutBack: (p: number) => {
      const c1 = 1.70158
      const c2 = c1 * 1.525
      return p < 0.5
        ? (Math.pow(2 * p, 2) * ((c2 + 1) * 2 * p - c2)) / 2
        : (Math.pow(2 * p - 2, 2) * ((c2 + 1) * (p * 2 - 2) + c2) + 2) / 2
    }
  }
}
```

### `helper/vue.ts`

```typescript
// 来源: packages/utils/src/helper/vue.ts
import {
  Text,
  Fragment,
  Comment,
  type VNode,
  isVNode,
  createTextVNode,
  type VNodeArrayChildren,
  shallowRef,
  watch,
  type ShallowRef
} from 'vue'

interface TextVNode extends VNode {
  children: string
}

/**
 * 是否为文本
 * @param node
 * @returns
 */
export function isTextNode(node: VNode): node is TextVNode {
  return node.type === Text
}

/**
 * 是否为片段
 * @param node
 * @returns
 */
export function isFragment(node: any): node is VNode {
  return node && node.type === Fragment
}

interface CommentVNode extends VNode {
  children: string
}

/**
 * 是否为注释
 * @param node
 * @returns
 */
export function isComment(node: VNode): node is CommentVNode {
  return node.type === Comment
}

/**
 * 是否为模板
 * @param node
 * @returns
 */
export function isTemplate(node: unknown): node is VNode {
  return isVNode(node) && node.type === 'template'
}

/**
 * 提取常规虚拟节点(移除type为fragment、template的节点)
 * @param nodes VNodeArrayChildren
 * @param results 虚拟节点
 * @returns
 */
export function extractNormalVNodes(nodes: VNodeArrayChildren, results: VNode[] = []): VNode[] {
  nodes.forEach((node) => {
    if (!isVNode(node)) {
      if (typeof node === 'string' || typeof node === 'number') {
        results.push(createTextVNode(String(node)))
      }
      return
    }
    if ((isFragment(node) || isTemplate(node)) && Array.isArray(node.children)) {
      extractNormalVNodes(node.children, results)
    } else {
      results.push(node)
    }
  })
  return results
}

export function shallowComputed<T>(getter: () => T): ShallowRef<T> {
  const result = shallowRef<T>(getter())
  watch(getter, (value) => {
    result.value = value
  })

  return result
}
```

## 响应式

### `reactive/proxy.ts`

```typescript
// 来源: packages/utils/src/reactive/proxy.ts
/**
 * 创建一个介于vue的reactive和shallowReactive对象的中间层
 * @description
 * 如果对象含有嵌套对象，则**递归**进行中间代理
 *
 * @param o 代理对象
 * @param handler 处理函数
 * @param options 代理配置
 * @returns 中间代理对象
 */
function createMiddleProxy(
  o: Record<string, any>,
  handler?: {
    set?: (field: string, val: any) => void
    get?: (field: string) => any
    changed?: (fields: string[]) => void
  },
  options?: {
    weakMap?: WeakMap<Record<string, any>, any>
    parentsField?: string
    changedFields?: string[]
  }
) {
  let { weakMap, parentsField, changedFields = [] } = options || {}
  if (!weakMap) {
    weakMap = new WeakMap()
  }

  return new Proxy(o, {
    set(target, field: string, val) {
      const changedField = parentsField ? `${parentsField}.${field}` : field
      handler?.set?.(changedField, val)
      target[field] = val

      changedFields.push(changedField)
      Promise.resolve().then(() => {
        if (!changedFields.length) return
        handler?.changed?.([...changedFields])
        changedFields.splice(0)
      })

      return true
    },

    get(target, field: string) {
      handler?.get?.(field)

      const val = target[field]
      if (
        val !== null &&
        typeof val === 'object' &&
        !(val instanceof Date) &&
        !(val instanceof RegExp)
      ) {
        if (weakMap.has(val)) return weakMap.get(val)
        const valProxy = createMiddleProxy(val, handler, {
          weakMap,
          parentsField: parentsField ? `${parentsField}.${field}` : field,
          changedFields
        })
        weakMap.set(val, valProxy)

        return valProxy
      }

      return val
    }
  })
}

/**
 * 中间代理, 用于vue的reactive和shallowReactive方法的中间层
 * @param o 代理对象
 * @param config 代理配置
 * @returns
 */
export function middleProxy<O extends Record<string, any>>(
  o: O,
  handler?: {
    set?: (field: string, val: any) => void
    get?: (field: string) => any
    /**
     * 数值变更回调，传入的参数是本次模型值变更的所有字段
     * @param fields 变更的字段
     */
    changed?: (fields: string[]) => void
  }
): O {
  return createMiddleProxy(o, handler) as O
}
```

