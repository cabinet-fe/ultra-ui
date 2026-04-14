# @veltra/utils — 辅助

```typescript
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

---

```typescript
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

---

```typescript
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

---

```typescript
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

---

```typescript
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

---

```typescript
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
