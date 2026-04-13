# @veltra/compositions — 源码与类型


> 由 `skills/veltra-compositions/scripts/sync-docs.ts` 自 `packages/compositions/src/` 生成。

## use-component-props

### `use-component-props/index.ts`

```typescript
// 来源: packages/compositions/src/use-component-props/index.ts
import { extractNormalVNodes } from '@veltra/utils'
import { defineComponent, isRef, type MaybeRef, createVNode, cloneVNode, type Component } from 'vue'

/**
 * 生成一个用于设置组件通用属性的组件
 * @param props 组件通用的属性
 * @returns
 */
export function useComponentProps<T extends Record<string, any>>(
  props: MaybeRef<T & Record<string, any>>
): Component {
  return defineComponent({
    name: 'ComponentCommonProps',
    inheritAttrs: false,

    props: {
      /** 渲染一个标准html5标签 */
      tag: { type: String }
    },

    setup(componentProps, { slots, attrs }) {
      const isPropsRef = isRef(props)
      // 非 ref 时 keys 固定，缓存避免每次 render 重复计算
      const staticKeys = isPropsRef ? null : Object.keys(props)

      const mergeNodesProps = (commonProps: Record<string, any>) => {
        const nodes = extractNormalVNodes(slots.default?.() ?? [])
        if (!nodes?.length) return undefined

        const keys = staticKeys ?? Object.keys(commonProps)
        return nodes.map((node) => {
          const mergedProps: Record<string, any> = {}
          let count = 0
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i]!
            // node中已定义的属性优先
            if (node.props?.[key] !== undefined) continue
            mergedProps[key] = attrs[key] !== undefined ? attrs[key] : commonProps[key]
            count++
          }
          return count > 0 ? cloneVNode(node, mergedProps) : node
        })
      }

      return () => {
        const _props = isPropsRef ? props.value : props
        const nodes = mergeNodesProps(_props)

        if (componentProps.tag) {
          if (!nodes) return undefined
          const tagProps = Object.keys(attrs).reduce<Record<string, any>>((acc, cur) => {
            if (!(cur in _props)) {
              acc[cur] = attrs[cur]
            }
            return acc
          }, {})
          return createVNode(componentProps.tag, tagProps, nodes)
        }
        return nodes
      }
    }
  })
}
```

## use-config

### `use-config/index.ts`

```typescript
// 来源: packages/compositions/src/use-config/index.ts
import { isObj } from '@cat-kit/core'
import type { ComponentSize } from '@veltra/utils'
import { reactive, readonly, watch } from 'vue'

interface State {
  /** 是否开启动画，机器老可以关闭动画来获得性能 */
  animation: boolean
  /** 组件尺寸大小 */
  size: ComponentSize
  /** 表单 */
  form: {
    /** 标签宽度 */
    labelWidth?: number | number
  }
  paginator: { pageSize: number; pageSizeOptions: number[] }
}

const state = reactive<State>({
  animation: true,
  size: 'default',
  form: { labelWidth: 80 },
  paginator: { pageSize: 40, pageSizeOptions: [40, 100, 200, 500, 1000] }
})

export function setDocumentSize(size: ComponentSize, oldSize?: ComponentSize): void {
  if (typeof document === 'undefined') return
  if (oldSize) {
    document.documentElement.classList.remove(oldSize)
  }
  document.documentElement.classList.add(size)
}

let stopDocumentSizeSync: (() => void) | null = null

function ensureDocumentSizeSync(): void {
  if (stopDocumentSizeSync) return
  if (typeof document === 'undefined') return

  stopDocumentSizeSync = watch(
    () => state.size,
    (size, oldSize) => setDocumentSize(size, oldSize)
  )
}

function deepSet(original: Record<string, any>, extend: Record<string, any>) {
  Object.keys(extend).forEach((key) => {
    const val = original[key]
    const targetVal = extend[key]
    if (isObj(val)) {
      if (isObj(targetVal)) {
        deepSet(val, targetVal)
      } else {
        console.warn(`extend['${key}']应该是一个对象`)
      }
    } else {
      original[key] = targetVal
    }
  })
}

export function useConfig(): {
  config: Readonly<State>
  setConfig: (conf: Partial<State>) => void
} {
  ensureDocumentSizeSync()
  return {
    /** 全局配置 */
    config: readonly(state) as Readonly<State>,
    /**
     * 设置全局配置项
     * @param conf
     */
    setConfig(conf: Partial<State>) {
      deepSet(state, conf)
    }
  }
}
```

## use-drag

### `use-drag/index.ts`

```typescript
// 来源: packages/compositions/src/use-drag/index.ts
import { type Ref, type ShallowRef, watch, onBeforeUnmount } from 'vue'

interface DragParams {
  /** 本次拖动水平距离 */
  x: number
  /** 本次拖动垂直距离 */
  y: number
  /** 拖拽目标水平偏移量 */
  offsetX: number
  /** 拖拽目标垂直偏移量 */
  offsetY: number
  /** 鼠标事件 */
  e: MouseEvent
}

interface DragOptions {
  /** 拖动目标 */
  target: ShallowRef<HTMLElement | undefined | null> | Ref<HTMLElement | undefined | null>
  /** 拖动开始 */
  onDragStart?(e: MouseEvent): void
  /** 拖动结束 */
  onDragEnd?(params: DragParams): void
  /** 拖动时 */
  onDrag?(params: DragParams): void
  /** 水平拖动范围 */
  rangeX?: [number, number]
  /** 垂直拖动范围 */
  rangeY?: [number, number]
  /** 初始偏移量 */
  initial?: { offsetX?: number; offsetY?: number }
}

/**
 * 拖动组合式方法
 * @param options 拖动选项
 */
export function useDrag(options: DragOptions): {
  update: (options: { offsetX?: number; offsetY?: number }) => void
} {
  const { target, onDragStart, onDrag, onDragEnd, rangeX, rangeY, initial } = options

  // 鼠标拖拽前的坐标
  let originX = 0
  let originY = 0

  let offsetX = initial?.offsetX ?? 0
  let offsetY = initial?.offsetY ?? 0

  // 拖拽参数
  const dragParams: DragParams = { x: 0, y: 0, offsetX: 0, offsetY: 0, e: null as any }

  // 先取
  const onselectstart = document.onselectstart

  const handleMousedown = (e: MouseEvent) => {
    // 阻止事件冒泡
    e.stopPropagation()
    // 鼠标左键按下有效
    if (e.button !== 0) return
    // 放置拖拽时选择内容
    window.getSelection()?.removeAllRanges()
    // 阻止后续的事件监听器被执行
    e.stopImmediatePropagation()

    originX = e.x
    originY = e.y

    onDragStart?.(e)

    // 禁止浏览器的选中事件, 直到mouseup事件触发时还原
    document.onselectstart = () => false
    document.addEventListener('mousemove', handleMousemove, { passive: true })
    document.addEventListener('mouseup', handleMouseup)
  }

  const getOffsetXWithRange = (deltaX: number) => {
    return Math.max(rangeX![0], Math.min(rangeX![1], offsetX + deltaX))
  }

  const getOffsetXWithoutRange = (deltaX: number) => {
    return offsetX + deltaX
  }

  const getOffsetYWithRange = (deltaY: number) => {
    return Math.max(rangeY![0], Math.min(rangeY![1], offsetY + deltaY))
  }

  const getOffsetYWithoutRange = (deltaY: number) => {
    return offsetY + deltaY
  }

  const getOffsetX = rangeX ? getOffsetXWithRange : getOffsetXWithoutRange
  const getOffsetY = rangeY ? getOffsetYWithRange : getOffsetYWithoutRange

  // 避免重复创建对象影响内存占用
  const setDragParam = (e: MouseEvent) => {
    dragParams.x = e.x - originX
    dragParams.y = e.y - originY
    dragParams.offsetX = getOffsetX(dragParams.x)
    dragParams.offsetY = getOffsetY(dragParams.y)
    dragParams.e = e
  }

  const handleMousemove = (e: MouseEvent) => {
    setDragParam(e)
    onDrag?.(dragParams)
  }

  const handleMouseup = (e: MouseEvent) => {
    setDragParam(e)
    offsetX = dragParams.offsetX
    offsetY = dragParams.offsetY

    onDragEnd?.(dragParams)
    document.onselectstart = onselectstart

    cleanup()
  }

  // 统一的清理函数
  const cleanup = () => {
    document.removeEventListener('mousemove', handleMousemove)
    document.removeEventListener('mouseup', handleMouseup)
  }

  watch(
    target,
    (dom, oldDom) => {
      oldDom?.removeEventListener('mousedown', handleMousedown)
      if (!dom) return
      dom.addEventListener('mousedown', handleMousedown)
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    target.value?.removeEventListener('mousedown', handleMousedown)
    cleanup()
  })

  return {
    update(options: { offsetX?: number; offsetY?: number }) {
      if (options.offsetX !== undefined) {
        offsetX = options.offsetX
      }
      if (options.offsetY !== undefined) {
        offsetY = options.offsetY
      }
    }
  }
}
```

## use-fallback-props

### `use-fallback-props/index.ts`

```typescript
// 来源: packages/compositions/src/use-fallback-props/index.ts
import type { ComponentSize } from '@veltra/utils'
import { computed, type ComputedRef } from 'vue'

import { useConfig } from '../use-config'

/**
 * 使用回滚属性，用于控制多级属性的使用优先级，如果多级属性中不存在该值，则使用全局配置中的属性，如再不存在则为undefined
 * @param propsList 属性列表，最右边的属性优先级最高
 * @param fallbackProps 要回滚的属性和默认值
 */
export function useFallbackProps<
  F extends Record<string, any>,
  R extends {
    [key in keyof F]: ComputedRef<F[key]>
  }
>(propsList: Record<string, any>[], fallbackProps: F): R {
  const { config } = useConfig()

  let result = {} as R

  for (const key in fallbackProps) {
    if (fallbackProps.hasOwnProperty(key)) {
      const defaultValue = fallbackProps[key]
      const ref = computed<any>(() => {
        for (let i = propsList.length - 1; i > -1; --i) {
          const props = propsList[i]!

          if (props[key] !== undefined) {
            return props[key]
          }
        }

        return config[key as string] ?? defaultValue
      })

      result[key as keyof F] = ref as R[keyof F]
    }
  }

  return result
}

type FormFallbackProps = { size: ComponentSize; disabled: boolean; readonly: boolean }

/**
 * 表单组件的回滚属性
 * @param propsList props列表
 * @returns
 */
export function useFormFallbackProps(propsList: Record<string, any>[]): {
  [key in keyof FormFallbackProps]: ComputedRef<FormFallbackProps[key]>
}

/**
 * 表单组件的回滚属性
 * @param propsList props列表
 * @param fallbackProps 回滚属性，可以只指定部分表单属性
 * @returns
 */
export function useFormFallbackProps<F extends Partial<FormFallbackProps>>(
  propsList: Record<string, any>[],
  fallbackProps: F
): {
  [key in keyof F]: key extends keyof FormFallbackProps
    ? ComputedRef<FormFallbackProps[key]>
    : never
}
export function useFormFallbackProps(
  propsList: Record<string, any>[],
  fallbackProps?: Record<string, any>
): any {
  if (!fallbackProps) {
    fallbackProps = { size: 'default', disabled: false, readonly: false }
  }
  return useFallbackProps(propsList, fallbackProps)
}
```

## use-focus

### `use-focus/index.ts`

```typescript
// 来源: packages/compositions/src/use-focus/index.ts
import { ref, type Ref } from 'vue'

/**
 * 聚焦
 * @param cb 回调
 * @returns
 */
export function useFocus(cb?: (focused: boolean) => void): {
  focus: Ref<boolean>
  handleBlur: () => void
  handleFocus: () => void
} {
  const focus = ref(false)

  const handleFocus = () => {
    focus.value = true
    cb?.(focus.value)
  }

  const handleBlur = () => {
    focus.value = false
    cb?.(focus.value)
  }

  return { focus, handleBlur, handleFocus }
}
```

## use-form-component

### `use-form-component/index.ts`

```typescript
// 来源: packages/compositions/src/use-form-component/index.ts
import type { FormContextInjectProps } from '@veltra/utils'
import { type InjectionKey, inject, provide } from 'vue'

type DIContext = {
  /** 表单属性 */
  formProps: FormContextInjectProps
}

const FormComponentDIKey: InjectionKey<DIContext> = Symbol('FormComponentDIKey')

/**
 * 表单组件本身的组合式方法
 * @param props 表单属性
 * @returns
 */
export function useFormComponent(props: FormContextInjectProps): void
/**
 * 表单内的组件的组合式方法
 * @returns 提供一个form的上下文
 */
export function useFormComponent(): {
  /** 是否在表单中 */
  inForm: boolean
} & Partial<DIContext>
export function useFormComponent(props?: any): any {
  if (props) {
    return provide(FormComponentDIKey, { formProps: props })
  }
  const context = inject(FormComponentDIKey, undefined) || {}
  return { inForm: !!context, ...context }
}
```

## use-lock

### `use-lock/index.ts`

```typescript
// 来源: packages/compositions/src/use-lock/index.ts
import { nextTick } from 'vue'

type Update = (fn: Function) => any
type Lock = (fn: Function) => Promise<void>

export interface Updater {
  /**
   * 更新
   * @description 在非锁定时执行传入的函数
   */
  update: Update
  /**
   * 更新并锁定
   * @description 执行传入的函数，并锁定更新操作，直到函数执行完成
   */
  updateAndLock: Lock
}

/**
 * 数据更新锁
 * @description
 * 更新锁主要用于防止组件数据更新时，循环触发更新。
 *
 * @returns 该函数返回两个函数：
 * 1. update: 更新函数，在非锁定时执行传入的函数
 * 2. lock: 锁定函数，执行时会锁定更新操作，直到锁定操作结束
 */
export function useUpdateLock(): Updater {
  let lockedCount = 0

  function update(fn: Function) {
    if (lockedCount > 0) return
    return fn()
  }

  async function updateAndLock(fn: Function) {
    lockedCount++

    try {
      await fn()
    } catch (error) {
      console.error(error)
    }
    await nextTick()

    lockedCount--
  }

  return { updateAndLock, update }
}
```

## use-model

### `use-model/index.ts`

```typescript
// 来源: packages/compositions/src/use-model/index.ts
import { type Ref, ref, watch, shallowRef } from 'vue'

interface ModelOptions<Props extends Record<string, unknown>, Name extends keyof Props> {
  /** 组件定义的属性 */
  props: Props
  /** 属性名称 */
  propName?: Name
  /** 事件触发函数 */
  emit: (...args: any[]) => void
  /** 是否为本地模式, 默认为true, 本地模式允许组件不受控来触发视图更新 */
  local?: boolean | (() => boolean)
  /** 默认值 */
  defaultValue?: Props[Name]
  /**
   * 是否浅层响应
   * @default false
   */
  shallow?: boolean
}

/**
 * 返回一个基于提供的选项的响应式模型值。
 * 该方法在将来可能会被替代, 目前使用是为了类型提示可用
 * 如果 local 选项为true, 模型值将是响应式的，并与属性值同步。
 * 如果 local 选项为 false，则模型值将是一个代理对象，具有 getter 和 setter。当值发生更改时，它会触发一个更新事件。
 * @param options - 选项
 * @returns - 一个模型值
 */

export function useModel<
  Props extends Record<string, any>,
  Name extends keyof Props = 'modelValue'
>(
  options: ModelOptions<Props, Name>
): Ref<Props[Name] | undefined> | { __v_isRef: boolean; value: Props[Name] } {
  const {
    props,
    propName = 'modelValue',
    emit,
    local = true,
    defaultValue,
    shallow = false
  } = options

  if (local) {
    const _default = props[propName] ?? defaultValue
    const r = shallow ? shallowRef : ref

    // 创建一个响应式对象
    const _value = r(_default)

    // 监听属性的变更
    watch(
      () => props[propName],
      (v) => {
        _value.value = v
      }
    )

    const getLocal = () => {
      return typeof local === 'function' ? local() : local
    }

    const value = {
      __v_isRef: true,
      get value() {
        return _value.value
      },
      set value(v) {
        if (v !== _value.value) {
          emit(`update:${propName as string}`, v)
        }
        if (getLocal()) {
          _value.value = v
        }
      }
    }

    return value
  }

  // 创建一个拥有getter和setter的对象
  const value = {
    __v_isRef: true,

    get value(): Props[Name] {
      return (props[propName] ?? defaultValue) as Props[Name]
    },

    set value(v: Props[Name]) {
      emit(`update:${propName as string}`, v)
    }
  }

  return value
}
```

## use-pop

### `use-pop/index.ts`

```typescript
// 来源: packages/compositions/src/use-pop/index.ts
import {
  computePosition,
  flip,
  shift,
  arrow,
  offset,
  type ComputePositionReturn,
  type Placement
} from '@floating-ui/dom'
import { getScrollParents, setStyles } from '@veltra/utils'
import { isRef, onBeforeUnmount, watch, type Ref, type ShallowRef } from 'vue'

type TipDirection = 'top' | 'bottom' | 'left' | 'right'
type TipAlign = 'center' | 'start' | 'end'

interface Options {
  /** 触发元素 */
  triggerRef: ShallowRef<HTMLElement | undefined>
  /** 内容元素 */
  contentRef: ShallowRef<HTMLElement | undefined>
  /**
   * 箭头元素，如果存在，则会在弹框的箭头位置显示箭头
   */
  arrowRef?: ShallowRef<HTMLElement | undefined>
  /** 方向 */
  direction?: ShallowRef<TipDirection> | TipDirection
  /** 对齐方式 */
  alignment?: ShallowRef<TipAlign> | TipAlign
  /**
   * 箭头大小
   * @default 10
   */
  arrowSize?: number
  /**
   * 触发器元素位置变更时回调，
   * 一般用于在触发器元素位置变更时更新弹框位置
   */
  onTriggerPositionChange?: () => void
  /** 更新元素前回调 */
  onBeforeUpdate?: (triggerEl: HTMLElement, contentEl: HTMLElement) => void
  /** 更新元素后回调 */
  onAfterUpdate?: (position: ComputePositionReturn) => void
  /** 弹框弹出时回调 */
  onPop?: (position: ComputePositionReturn) => void
}

interface PopResult {
  /**
   * 更新弹框位置
   */
  update: () => Promise<void>
  /** 浮框容器id */
  popperContainerId: string
}

let popperContainer: HTMLElement | null = null

const popperContainerId = 'pop-container'

/**
 * 浮框组合式函数
 * @param options 选项
 * @returns
 */
export function usePop(options: Options): PopResult {
  if (!popperContainer) {
    popperContainer = document.createElement('div')
    popperContainer.id = popperContainerId
    document.body.appendChild(popperContainer)
  }

  const {
    triggerRef,
    contentRef,
    arrowRef,
    arrowSize = 10,
    onTriggerPositionChange,
    onAfterUpdate,
    onBeforeUpdate,
    direction,
    alignment,
    onPop
  } = options

  /** 箭头位置 */
  const arrowPlacementDict = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' }

  function getMaybeRefValue<T>(value?: Ref<T> | T) {
    return isRef(value) ? value.value : value
  }

  /**
   * 更新浮框位置
   * @param callbackOnPop 是否在弹出时回调
   */
  async function update(callbackOnPop = false) {
    const triggerEl = triggerRef.value
    const contentEl = contentRef.value

    if (!(triggerEl instanceof HTMLElement) || !(contentEl instanceof HTMLElement)) {
      return
    }

    onBeforeUpdate?.(triggerEl, contentEl)

    // 计算位置 ↓↓↓
    const middleware = [offset(arrowRef?.value ? arrowSize : 6), flip(), shift()]

    if (arrowRef?.value) {
      middleware.push(arrow({ element: arrowRef.value }))
    }

    const _direction = getMaybeRefValue(direction) ?? 'top'
    const _alignment = getMaybeRefValue(alignment) ?? 'center'

    const position = await computePosition(triggerEl, contentEl, {
      middleware,

      placement: `${_direction}${_alignment === 'center' ? '' : `-${_alignment}`}` as Placement
    })

    const { x, y, middlewareData, placement } = position

    setStyles(contentEl, { left: `${x}px`, top: `${y}px` })
    callbackOnPop && onPop?.(position)
    onAfterUpdate?.(position)

    // 设置箭头位置 ↓↓↓
    if (middlewareData.arrow) {
      const { x: arrowX, y: arrowY } = middlewareData.arrow

      const arrowPlacement =
        arrowPlacementDict[placement.split('-')[0]! as keyof typeof arrowPlacementDict]
      const size = `${arrowSize}px`
      // 箭头半径
      const arrowRadius = arrowSize / 2

      setStyles(arrowRef!.value!, {
        width: size,
        height: size,
        left: arrowX && `${arrowX - arrowRadius}px`,
        top: arrowY && `${arrowY - arrowRadius}px`,
        [arrowPlacement]: `-${arrowRadius}px`
      })
    }
    // 设置箭头位置 ↑↑↑
  }

  let scrollParents: HTMLElement[] = []

  /** 为触发器元素的祖先元素添加滚动事件 */
  function addScrollEvents() {
    if (!triggerRef.value) return
    if (onTriggerPositionChange) {
      scrollParents = getScrollParents(triggerRef.value)
      scrollParents.forEach((el) => {
        el.addEventListener('scroll', onTriggerPositionChange)
      })
    }
  }

  /** 移除触发器元素祖先元素的滚动事件 */
  function removeScrollEvents() {
    if (onTriggerPositionChange) {
      scrollParents.forEach((el) => {
        el.removeEventListener('scroll', onTriggerPositionChange)
      })
    }

    scrollParents = []
  }

  function addResizeEvents() {
    onTriggerPositionChange && window.addEventListener('resize', onTriggerPositionChange)
  }

  function removeResizeEvents() {
    onTriggerPositionChange && window.removeEventListener('resize', onTriggerPositionChange)
  }

  watch(
    [contentRef, () => getMaybeRefValue(direction), () => getMaybeRefValue(alignment)],
    ([content]) => {
      if (content) {
        update(true)
        addScrollEvents()
        addResizeEvents()
        return
      }
      removeScrollEvents()
      removeResizeEvents()
    }
  )

  onBeforeUnmount(() => {
    removeScrollEvents()
    removeResizeEvents()
  })

  return {
    /** 更新浮框位置 */
    update,
    /** 浮框容器id */
    popperContainerId
  }
}
```

## use-reactive-size

### `use-reactive-size/index.ts`

```typescript
// 来源: packages/compositions/src/use-reactive-size/index.ts
import { computed, reactive } from 'vue'

import { useResizeObserver, type RefElement } from '../use-resize-observer'

interface ElementSize {
  width: number
  height: number
}

/**
 * 响应式尺寸
 * @param targets 目标元素
 * @returns 目标元素的宽高
 */
export function useReactiveSize(target: RefElement): ElementSize
export function useReactiveSize(targets: RefElement[]): ElementSize[]
export function useReactiveSize(targets: RefElement | RefElement[]): ElementSize | ElementSize[] {
  const sizes = Array.isArray(targets)
    ? targets.map(() => {
        return reactive({ width: 0, height: 0 })
      })
    : reactive({ width: 0, height: 0 })

  const sizesMap = Array.isArray(targets)
    ? computed(() => {
        const entries = targets
          .map((target, index) => {
            return [target.value!, (sizes as ElementSize[])[index]!]
          })
          .filter(([target]) => target) as [HTMLElement, ElementSize][]

        return new WeakMap(entries)
      })
    : computed(() => {
        return new WeakMap(targets.value ? [[targets.value, sizes as ElementSize]] : [])
      })

  useResizeObserver({
    targets,
    onResize(entries) {
      entries.forEach((entry) => {
        const borderBoxSize = entry.borderBoxSize[0]!
        const size = sizesMap.value.get(entry.target as HTMLElement)
        if (size && borderBoxSize) {
          size.width = borderBoxSize.inlineSize
          size.height = borderBoxSize.blockSize
        }
      })
    }
  })

  return sizes
}
```

## use-resize-observer

### `use-resize-observer/index.ts`

```typescript
// 来源: packages/compositions/src/use-resize-observer/index.ts
import { type Ref, type ShallowRef, onBeforeUnmount, watch } from 'vue'

export type RefElement =
  | ShallowRef<HTMLElement | undefined | null>
  | Ref<HTMLElement | undefined | null>

interface ResizeObserverOptions {
  /** 目标节点 */
  targets: RefElement | RefElement[]
  /** resize事件 */
  onResize: ResizeObserverCallback
  /** 指定观察条件 */
  when?: () => boolean
}

/** 监听器 */
export type ResizeObserverReturn = {
  /** 终止监听 */
  disconnect: () => void
}

/**
 * 取消监听
 * @param targets 目标节点
 * @param observer 观察器
 */
function unobserve(targets: RefElement | RefElement[], observer?: ResizeObserver) {
  if (Array.isArray(targets)) {
    return targets.forEach((target) => unobserve(target, observer))
  }
  if (!targets.value || !observer) return
  observer.unobserve(targets.value)
  observer.disconnect()
}

/**
 * 监听目标尺寸变化
 * @param options 选项
 */
export function useResizeObserver(options: ResizeObserverOptions): ResizeObserverReturn {
  const { targets, onResize } = options

  let observer: ResizeObserver | undefined

  if (Array.isArray(targets)) {
    watch(
      targets,
      (val, oldVal) => {
        // 清除旧的观察
        oldVal.forEach((target) => {
          target && observer?.unobserve(target)
        })

        if (!observer && !!val.length) {
          observer = new ResizeObserver(onResize)
        }

        val.forEach((target) => {
          target && observer?.observe(target)
        })
      },
      { immediate: true }
    )
  } else {
    watch(
      targets,
      (val, oldVal) => {
        oldVal && observer?.unobserve(oldVal)
        if (!observer && val) {
          observer = new ResizeObserver(onResize)
        }
        val && observer?.observe(val)
      },
      { immediate: true }
    )
  }

  onBeforeUnmount(() => {
    unobserve(targets, observer)
    observer = undefined
  })

  return {
    disconnect() {
      unobserve(targets, observer)
      observer = undefined
    }
  }
}

/**
 * 监听元素尺寸变化
 */
export function useObserverCallback(): {
  observeEl: <El extends HTMLElement>(
    el: El,
    cb: (entry: Omit<ResizeObserverEntry, 'target'> & { target: El }) => void
  ) => void
  unobserveEl: (el: HTMLElement) => void
} {
  const observerElMap = new Map<HTMLElement, Function>()

  const observer = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const target = entry.target as HTMLElement
      if (!target.dataset.ob) {
        target.dataset.ob = 'true'
        return
      }
      const fn = observerElMap.get(target)

      fn?.(entry)
    })
  })

  /**
   * 监听元素尺寸
   * @param el 元素
   * @param cb 回调
   */
  function observeEl<El extends HTMLElement>(
    el: El,
    cb: (entry: Omit<ResizeObserverEntry, 'target'> & { target: El }) => void
  ) {
    observer.observe(el)
    observerElMap.set(el, cb)
  }

  /**
   * 取消监听元素尺寸
   * @param el 元素
   */
  function unobserveEl(el: HTMLElement) {
    observer.unobserve(el)
    delete el.dataset.ob
    observerElMap.delete(el)
  }

  onBeforeUnmount(() => {
    observerElMap.forEach((_, el) => {
      observer.unobserve(el)
    })
    observerElMap.clear()
    observer.disconnect()
  })

  return { observeEl, unobserveEl }
}
```

## use-transition

### `use-transition/index.ts`

```typescript
// 来源: packages/compositions/src/use-transition/index.ts
import type { Returned, CssTransitionOptions, StyleTransitionOptions } from './type'
import { useCssTransition } from './use-css-transition'
import { useStyleTransition } from './use-style-transition'

/**
 * 使用CSS类过渡
 * @param type 过渡类型
 * @param options 过渡选项
 */
export function useTransition(type: 'css', options: CssTransitionOptions): Returned
/**
 * 使用style样式过渡
 * @param type 过渡类型
 * @param options 过渡选项
 */
export function useTransition(type: 'style', options: StyleTransitionOptions): Returned
export function useTransition(type: string, options: any): Returned {
  if (type === 'css') {
    return useCssTransition(options)
  }
  return useStyleTransition(options)
}
```

### `use-transition/type.ts`

```typescript
// 来源: packages/compositions/src/use-transition/type.ts
import type { CSSProperties, Ref, ShallowRef } from 'vue'

export interface TransitionBase {
  /** 被应用的目标元素 */
  target: ShallowRef<HTMLElement | undefined> | HTMLElement
  /** 进入动画结束回调 */
  afterEnter?: () => void
  /** 进入动画被取消回调 */
  enterCanceled?: () => void
  /** 离开动画结束回调 */
  afterLeave?: () => void
  /** 离开动画被取消回调 */
  leaveCanceled?: () => void
}

export interface CssTransitionOptions extends TransitionBase {
  /** 类的名称, 会生成 `${name}-enter-${'to' | 'active' | 'from'}`, `${name}-leave-${'to' | 'active' | 'from'}这几种类` */
  name: ShallowRef<string> | string | Ref<string>
  /** 保留进入类 */
  keepEnterTo?: boolean
}

export interface StyleTransitionOptions extends TransitionBase {
  // /** 动画进入前的样式 */
  // enterFrom?: CSSProperties
  // /** 动画离开后的样式 */
  // leaveTo?: CSSProperties
  /** 进入后的样式 */
  enterTo: CSSProperties
  /** 进入过渡时的样式 */
  enterActive: CSSProperties
  /** 离开过渡时的样式 */
  leaveActive: CSSProperties
}

export interface Returned {
  /**
   * 切换进入/离开动画
   * @param active 是否激活
   */
  toggle(active: boolean | ((active: boolean) => boolean)): void
  /**
   * 标记进入动画, toggle(true)的别名
   */
  enter(): void
  /**
   * 标记离开动画, toggle(false)的别名
   */
  leave(): void
}
```

### `use-transition/use-css-transition.ts`

```typescript
// 来源: packages/compositions/src/use-transition/use-css-transition.ts
import { createToggle } from '@veltra/utils'
import { isRef, watch, onBeforeUnmount, computed } from 'vue'

import type { Returned, CssTransitionOptions } from './type'

const increaseTransitionCount = (el: HTMLElement & { _count?: number }) => {
  el._count = (el._count ?? 0) + 1
}

const decreaseTransitionCount = (el: HTMLElement & { _count?: number }) => {
  el._count = (el._count ?? 0) - 1
  if (el._count <= 0) {
    delete el._count
  }
}

/**
 * 使用css过渡
 * @param options 过渡选项
 */
export function useCssTransition(options: CssTransitionOptions): Returned {
  const {
    name,
    target,
    afterEnter,
    afterLeave,
    enterCanceled,
    leaveCanceled,
    keepEnterTo = false
  } = options

  const getDom = (): (HTMLElement & { _count?: number }) | undefined =>
    isRef(target) ? target.value : target

  const classes = computed(() => {
    const _name = typeof name === 'string' ? name : name.value
    return {
      /** 进入前的类 */
      enterFrom: `${_name}-enter-from`,
      /** 进入后最终的类 */
      enterTo: `${_name}-enter-to`,
      /** 【进入动画】持续时的类 */
      enterActive: `${_name}-enter-active`,
      /** 离开前的类 */
      leaveFrom: `${_name}-leave-from`,
      /** 离开类 */
      leaveTo: `${_name}-leave-to`,
      /** 【离开动画】持续时的类 */
      leaveActive: `${_name}-leave-active`
    }
  })

  /** 开始进入动画 */
  const startTransitionIn = () => {
    const { enterActive, enterTo, enterFrom } = classes.value
    const dom = getDom()

    dom?.classList.add(enterFrom)

    requestAnimationFrame(() => {
      dom?.classList.add(enterActive)
      requestAnimationFrame(() => {
        dom?.classList.remove(enterFrom)
        dom?.classList.add(enterTo)
      })
    })
  }

  /** 开始离开动画 */
  const startTransitionOut = () => {
    const { leaveTo, leaveActive, leaveFrom, enterTo } = classes.value
    const dom = getDom()

    // 标记动画进入离开状态
    if (keepEnterTo) {
      dom?.classList.remove(enterTo)
    }
    dom?.classList.add(leaveFrom, leaveActive)

    requestAnimationFrame(() => {
      dom?.classList.add(leaveActive)
      requestAnimationFrame(() => {
        dom?.classList.remove(leaveFrom)
        dom?.classList.add(leaveTo)
      })
    })
  }

  const [active, toggle] = createToggle(false, (_active) => {
    _active ? startTransitionIn() : startTransitionOut()
  })

  const transitionEndHandler = (e: TransitionEvent) => {
    e.stopPropagation()

    const { leaveActive, enterActive, enterTo, leaveTo } = classes.value
    const dom = getDom()

    if (dom !== e.target) return

    decreaseTransitionCount(dom)

    if (dom._count) return

    // 激活状态，移除enter-active类
    if (active.value) {
      if (keepEnterTo) {
        dom?.classList.remove(enterActive)
      } else {
        dom?.classList.remove(enterActive, enterTo)
      }
      afterEnter?.()
    } else {
      dom?.classList.remove(leaveActive, leaveTo)
      afterLeave?.()
    }
  }

  const transitionRunHandler = (e: TransitionEvent) => {
    e.stopPropagation()
    const dom = getDom()
    if (dom !== e.target) return
    increaseTransitionCount(dom)
  }

  const transitionCancelHandler = (e: TransitionEvent) => {
    e.stopPropagation()
    const dom = getDom()

    if (dom !== e.target) return
    decreaseTransitionCount(dom)

    if (dom._count) return

    const { leaveActive, enterActive } = classes.value

    // 激活状态，移除enter-active类
    if (active.value) {
      dom?.classList.remove(enterActive)
      enterCanceled?.()
    } else {
      dom?.classList.remove(leaveActive)
      leaveCanceled?.()
    }
  }

  /** 添加事件 */
  const addEvent = (el?: HTMLElement) => {
    el?.addEventListener('transitioncancel', transitionCancelHandler)
    el?.addEventListener('transitionend', transitionEndHandler)
    el?.addEventListener('transitionrun', transitionRunHandler)
  }

  /** 移除事件 */
  const removeEvent = (el?: HTMLElement) => {
    el?.removeEventListener('transitioncancel', transitionCancelHandler)
    el?.removeEventListener('transitionend', transitionEndHandler)
    el?.removeEventListener('transitionrun', transitionRunHandler)
  }

  if (isRef(target)) {
    watch(target, (_target, oldTarget) => {
      if (oldTarget) {
        removeEvent(oldTarget)
      }
      _target && addEvent(_target)
    })
  } else if (target) {
    addEvent(target)
  }

  onBeforeUnmount(() => {
    const dom = getDom()
    removeEvent(dom)
  })

  return {
    toggle,
    enter() {
      toggle(true)
    },
    leave() {
      toggle(false)
    }
  }
}
```

### `use-transition/use-style-transition.ts`

```typescript
// 来源: packages/compositions/src/use-transition/use-style-transition.ts
import { createToggle, nextFrame, setStyles } from '@veltra/utils'
import { isRef, watch, type CSSProperties } from 'vue'

import type { Returned, StyleTransitionOptions } from './type'
import { watchTransition } from './utils'

export function useStyleTransition(options: StyleTransitionOptions): Returned {
  const {
    // enterFrom,
    // leaveTo,
    enterTo,
    enterActive,
    leaveActive,
    target,
    afterEnter,
    afterLeave,
    enterCanceled,
    leaveCanceled
  } = options

  const getDom = (): HTMLElement | undefined => (isRef(target) ? target.value : target)

  /** 进入动画前的初始状态 */
  const transitionOriginStyle: CSSProperties = {}

  /** 获取过渡样式的初始样式 */
  const getOriginStyles = (styles: CSSProperties) => {
    return Object.fromEntries(
      Object.keys(styles).map((key) => {
        return [key, transitionOriginStyle[key as keyof CSSProperties]]
      })
    )
  }
  // 监听dom并获取dom在进入动画之前的样式
  // ...Object.keys(enterFrom ?? {}),
  // ...Object.keys(leaveTo ?? {}),
  watch(
    () => getDom(),
    (dom) => {
      if (dom) {
        const map = dom.attributeStyleMap
        ~[...Object.keys(enterTo), ...Object.keys(enterActive)].forEach((key) => {
          transitionOriginStyle[key] = map.get(key)
        })
      } else {
        Object.keys(transitionOriginStyle).forEach((key) => {
          delete transitionOriginStyle[key as keyof CSSProperties]
        })
      }
    },
    { immediate: true }
  )

  /**
   * 添加过渡进入时并持续时的样式
   * @param dom 元素
   */
  const addEnterActive = (dom: HTMLElement) => {
    setStyles(dom, enterActive)
  }

  /**
   * 移除过渡进入时并持续时的样式
   * @param dom 元素
   */
  const removeEnterActive = (dom: HTMLElement) => {
    setStyles(dom, getOriginStyles(enterActive))
  }

  /**
   * 添加过渡离开并持续时的样式
   * @param dom 元素
   */
  const addLeaveActive = (dom: HTMLElement) => {
    setStyles(dom, leaveActive)
  }

  /**
   * 移除过渡离开并持续时的样式
   * @param dom 元素
   */
  const removeLeaveActive = (dom: HTMLElement) => {
    setStyles(dom, getOriginStyles(leaveActive))
  }

  /**
   * 添加过渡目标样式
   * @param dom 元素
   */
  // const addEnterFromStyle = (dom: HTMLElement) => {
  //   enterFrom && setStyles(dom, enterFrom)
  // }

  /**
   * 移除过渡目标样式
   * @param dom 元素
   */
  // const removeEnterFromStyle = (dom: HTMLElement) => {
  //   if (!enterFrom) return

  //   const canRemovedStyles = {}

  //   for (const key in enterFrom) {
  //     if (key in enterTo) continue
  //     canRemovedStyles[key] = enterFrom[key]
  //   }

  //   setStyles(dom, getOriginStyles(canRemovedStyles))
  // }
  /**
   * 添加过渡目标样式
   * @param dom 元素
   */
  const addEnterToStyle = (dom: HTMLElement) => {
    setStyles(dom, enterTo)
  }

  /**
   * 移除过渡目标样式
   * @param dom 元素
   */
  const removeEnterToStyle = (dom: HTMLElement) => {
    setStyles(dom, getOriginStyles(enterTo))
  }

  /** 开始进入动画 */
  const startEnter = () => {
    const dom = getDom()
    if (!dom) return
    addEnterActive(dom)
    // 在下一帧插入动画运动目标状态
    nextFrame(() => {
      addEnterToStyle(dom)
    })
  }

  /** 开始离开动画 */
  const startLeave = () => {
    const dom = getDom()
    if (!dom) return

    // 标记动画进入离开状态
    addLeaveActive(dom)

    // 在下一帧移除动画运动目标状态恢复原状或者应用新的状态
    nextFrame(() => {
      removeEnterToStyle(dom)
    })
  }

  const [active, toggle] = createToggle(false, (active) => {
    active ? startEnter() : startLeave()
  })

  watchTransition(getDom, {
    styleKeys: Object.keys(enterTo),
    onCancel(el) {
      // 激活状态，移除enter-active类
      if (active.value) {
        removeEnterActive(el)
        enterCanceled?.()
      } else {
        removeLeaveActive(el)
        leaveCanceled?.()
      }
    },

    onEnd(el) {
      if (active.value) {
        removeEnterActive(el)
        // removeEnterFromStyle(el)
        afterEnter?.()
      } else {
        removeLeaveActive(el)

        afterLeave?.()
      }
    }
  })

  return { toggle, enter: () => toggle(true), leave: () => toggle(false) }
}
```

### `use-transition/utils.ts`

```typescript
// 来源: packages/compositions/src/use-transition/utils.ts
import { watch, onBeforeUnmount } from 'vue'

/**
 * 监听过渡
 * @param domGetter 元素获取函数
 * @param config 配置
 * @returns
 */
export function watchTransition(
  domGetter: () => HTMLElement | undefined,
  config: {
    styleKeys: string[]
    onEnd: (dom: HTMLElement) => void
    onCancel: (dom: HTMLElement) => void
  }
): void {
  const runCallback = (e: TransitionEvent, cb: (el: HTMLElement) => void) => {
    e.stopPropagation()
    if (e.target !== domGetter() || !config.styleKeys.includes(e.propertyName)) {
      return
    }

    cb(e.target as HTMLElement)
  }

  const transitionEndHandler = (e: TransitionEvent) => {
    if (!domGetter()) return
    runCallback(e, config.onEnd)
  }
  const transitionCancelHandler = (e: TransitionEvent) => {
    if (!domGetter()) return
    runCallback(e, config.onCancel)
  }
  const addEvent = (el: HTMLElement) => {
    el.addEventListener('transitionend', transitionEndHandler, false)
    // el.addEventListener('transitioncancel', transitionCancelHandler, false)
  }

  const removeEvent = (el?: HTMLElement) => {
    el?.removeEventListener('transitionend', transitionEndHandler)
    el?.removeEventListener('transitioncancel', transitionCancelHandler)
  }

  watch(
    domGetter,
    (target, oldTarget) => {
      removeEvent(oldTarget)
      target && addEvent(target)
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    removeEvent(domGetter())
  })
}
```

## use-virtual

### `use-virtual/index.ts`

```typescript
// 来源: packages/compositions/src/use-virtual/index.ts
import {
  elementScroll,
  observeElementOffset,
  observeElementRect,
  type VirtualItem,
  Virtualizer
} from '@tanstack/vue-virtual'
import {
  computed,
  isRef,
  onScopeDispose,
  shallowRef,
  watch,
  type ComputedRef,
  type Ref,
  type ShallowRef
} from 'vue'

interface Options {
  /** 指定启用虚拟列表的阈值 */
  virtualThreshold?: number | Ref<number | undefined>
  /** 数量 */
  count: Ref<number>
  /** 滚动容器 */
  scrollEl: ShallowRef<HTMLElement | null>
  /** 估算高度(宽度) */
  estimateSize?: (index: number) => number
  /** 列表项之间的间距 */
  gap?: number
}

type CustomVirtualItem = Omit<VirtualItem, 'key'> & { key: number | string }

export type VirtualReturned = {
  /** 虚拟列表 */
  virtualList: ShallowRef<CustomVirtualItem[]>
  /** 总高度 */
  totalHeight: ShallowRef<number>
  /** 测量元素高度 */
  measureElement: (el: any) => void
  /** 滚动到指定索引 */
  scrollTo: (index: number) => void
  /** 是否启用虚拟列表 */
  virtualEnabled: ComputedRef<boolean>
}

const defaultEstimateSize = () => 34

export function useVirtual(options: Options): VirtualReturned {
  const { count, scrollEl, estimateSize, virtualThreshold, gap } = options

  const enabled = computed(() => {
    if (isRef(virtualThreshold)) {
      return virtualThreshold.value ? count.value > virtualThreshold.value : true
    }

    return virtualThreshold ? count.value > virtualThreshold : true
  })

  const virtualList = shallowRef<CustomVirtualItem[]>([])

  /** 总高度 */
  const totalHeight = shallowRef(0)

  function updateVirtualList() {
    if (enabled.value) {
      totalHeight.value = v.getTotalSize()
      virtualList.value = v.getVirtualItems() as CustomVirtualItem[]
    }
  }

  const virtualizerOptions = computed(() => {
    return {
      enabled: enabled.value,
      count: count.value,
      getScrollElement: () => scrollEl.value,
      estimateSize: estimateSize ?? defaultEstimateSize,
      overscan: 3,
      gap,
      observeElementRect: observeElementRect,
      observeElementOffset: observeElementOffset,
      scrollToFn: elementScroll,
      onChange: updateVirtualList
    }
  })

  const v = new Virtualizer(virtualizerOptions.value)

  updateVirtualList()

  const cleanup = v._didMount()

  watch(
    scrollEl,
    (el) => {
      el && v._willUpdate()
    },
    { immediate: true }
  )

  watch(
    () => virtualizerOptions.value,
    (o) => {
      v.setOptions(o)

      v._willUpdate()

      updateVirtualList()
    }
  )

  onScopeDispose(() => {
    cleanup()
  })

  function scrollTo(index: number) {
    v.scrollToIndex(index, { align: 'center' })
  }

  /** 测量元素高度 */
  function measureElement(el: Element) {
    if (!el) return

    v.measureElement(el)

    return undefined
  }

  return { virtualEnabled: enabled, virtualList, totalHeight, measureElement, scrollTo }
}
```

