# @veltra/compositions

Vue 3 组合式函数。前置依赖 `vue@^3.5`、`@floating-ui/dom`、`@cat-kit/fe`、`@veltra/utils`。

```ts
import {
  useConfig,
  setDocumentSize,
  useFallbackProps,
  useFormFallbackProps,
  useModel,
  usePop,
  useDrag,
  useFocus,
  useUserAction,
  useTransition,
  useResizeObserver,
  useReactiveSize,
  useVirtualizer,
  useComponentProps
} from '@veltra/compositions'
```

---

## 高频 API

### `useConfig()` — 全局配置

```ts
const { config, setConfig } = useConfig()
setConfig({ size: 'large', animation: false })
setConfig({ form: { labelWidth: 120 } }) // 深合并

config.size // ComponentSize
config.animation // boolean
config.form.labelWidth // number
config.paginator.pageSize // number
config.paginator.pageSizeOptions // number[]
```

`config` 只读；`config.size` 变化自动同步 `<html>` size 类名（内部调用 `setDocumentSize`）。也可直接：

```ts
setDocumentSize('large', 'default') // 切换 <html> 上的 size 类
```

`labelPosition` **不在** `config.form` 中，由 `UForm` 经 `@veltra/utils` 的 `FormContextProps` provide。

`State` 形状：

```ts
interface State {
  animation: boolean
  size: ComponentSize
  form: { labelWidth?: number | string }
  paginator: { pageSize: number; pageSizeOptions: number[] }
}
```

### `useFallbackProps()` — 多级属性回退

```ts
function useFallbackProps<F extends Record<string, any>>(
  propsList: Record<string, any>[],
  fallbackProps: F
): { [K in keyof F]: ComputedRef<F[K]> }
```

从右向左找第一个非 `undefined`：`propsList[last] → ... → propsList[0] → useConfig 全局 → fallbackProps`。

```ts
const props = defineProps<{ size?: ComponentSize; disabled?: boolean }>()
const { size, disabled } = useFallbackProps([props], { size: 'default', disabled: false })
```

### `useFormFallbackProps()` — 表单专用

封装表单组件回退默认值 `{ size: 'default', disabled: false, readonly: false }`。可只覆盖部分字段。链：props → formProps → config → 默认值。

```ts
import { injectFormContext } from '@veltra/utils'
const { formProps } = injectFormContext()
const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])
```

### `useModel()` — 双向绑定

```ts
function useModel<P, N extends keyof P = 'modelValue'>(options: {
  props: P
  emit: (...args: any[]) => void
  propName?: N // 默认 'modelValue'
  local?: boolean | (() => boolean) // 默认 true
  shallow?: boolean
  defaultValue?: P[N]
}): Ref<P[N] | undefined>

useModel({ props, emit }) // 本地副本（默认）
useModel({ props, emit, local: false }) // 纯代理：set 仅 emit
useModel({ props, emit, local: () => props.modelValue === undefined }) // 受控自动切换
useModel({ props, emit, propName: 'visible' }) // 自定义 prop
```

### `usePop()` — 浮框定位

基于 `@floating-ui/dom`，支持 `flip`/`shift`/`offset`/`arrow`，自动监听触发器祖先滚动与 window resize。模块级单例 `<div id="pop-container">` 自动挂在 `document.body`。

```ts
function usePop(options: {
  triggerRef: ShallowRef<HTMLElement | undefined>
  contentRef: ShallowRef<HTMLElement | undefined>
  arrowRef?: ShallowRef<HTMLElement | undefined>
  direction?: ShallowRef<'top' | 'bottom' | 'left' | 'right'> | 'top' | 'bottom' | 'left' | 'right'
  alignment?: ShallowRef<'center' | 'start' | 'end'> | 'center' | 'start' | 'end'
  arrowSize?: number // 默认 10
  onTriggerPositionChange?: () => void // 仅注册监听，回调内自行调用 update
  onBeforeUpdate?: (triggerEl: HTMLElement, contentEl: HTMLElement) => void
  onAfterUpdate?: (pos: ComputePositionReturn) => void
  onPop?: (pos: ComputePositionReturn) => void
}): { update: () => Promise<void>; popperContainerId: string }

const { update } = usePop({
  triggerRef,
  contentRef,
  direction: 'bottom',
  alignment: 'center',
  onTriggerPositionChange: () => update(),
  onBeforeUpdate: (t, c) => {
    c.style.minWidth = t.offsetWidth + 'px'
  }
})
```

---

## 低频 API

### `useDrag(options)`

```ts
useDrag({
  target: shallowRef<HTMLElement>(),
  rangeX: [0, 500],
  rangeY: [0, 300], // [number, number]，可省略
  initial: { offsetX: 0, offsetY: 0 },
  onDragStart: (e) => {},
  onDrag: ({ x, y, offsetX, offsetY, e }) => {},
  onDragEnd: ({ offsetX, offsetY }) => {}
}) // 返回 { update: ({ offsetX?, offsetY? }) => void }
```

仅响应左键。`x/y` 为本次累计偏移；`offsetX/offsetY` 为 range 钳制后最终偏移。

### `useFocus(cb?)`

```ts
const { focus, handleFocus, handleBlur } = useFocus((focused) => {}) // @focus / @blur
```

### `useUserAction()` — 区分用户动作 / 程序回流

解决 emit → props 回灌 → watch 副作用循环更新。`userAction(fn)` 包装为异步函数，进入 `actionCount++`，`await nextTick()` 后 `--`。

```ts
const { userAction, isUserActive } = useUserAction()
const handleSelect = userAction((d: Date) => {
  current.value = d
  emit('update:modelValue', d)
})
watch(
  () => props.modelValue,
  (v) => {
    if (isUserActive()) return // 用户动作期间跳过回显
    current.value = v
  }
)
```

### `useTransition(type, options)` — 命令式过渡

两种类型，签名不同；均返回 `{ toggle(active), enter(), leave() }`。

```ts
// CSS 类：生成 `${name}-enter-from|active|to` 与 `${name}-leave-from|active|to`
useTransition('css', {
  target: shallowRef<HTMLElement>(),
  name: 'fade',
  keepEnterTo: false, // name: string | Ref<string>
  afterEnter: () => {},
  afterLeave: () => {}
})
// 内联 style
useTransition('style', {
  target: shallowRef<HTMLElement>(),
  enterTo: { opacity: '1' },
  enterActive: { transition: 'opacity .3s' },
  leaveActive: { transition: 'opacity .3s' }
})
```

### `useResizeObserver(options)`

```ts
useResizeObserver({
  targets: elRef, // 单 ref 或 ref 数组
  onResize: (entries) => {},
  when: () => true // when 可选
}) // 返回 { disconnect: () => void }
```

派生 `useObserverCallback()` 返回 `{ observeEl, unobserveEl }`，按元素维度注册回调。

### `useReactiveSize(target | targets)`

```ts
const size = useReactiveSize(elRef) // reactive { width, height }
const sizes = useReactiveSize([el1, el2]) // reactive[]
// 模板直接 size.width（非 ref，无需 .value）
```

### `useVirtualizer(options)` — 虚拟滚动

`@cat-kit/fe` 的 `Virtualizer` Vue 适配层。`totalSize`/`beforeSize`/`afterSize` 命令式写 `style.height|width` 落 DOM，避免滚动期 Vue 重渲染。约束：`initialOffset` / `initialViewport` 仅构造时生效。

```ts
const { virtualizer, items, isScrolling, snapshot } = useVirtualizer({
  count: countRef, // Ref<number>
  scrollEl: scrollRef,
  contentEl,
  beforeEl,
  afterEl, // 可选，自动写对应尺寸
  estimateSize: () => 40,
  getItemKey: (i) => list.value[i].id
  // 其他 VirtualizerOptions 字段（不含 count）
})
// virtualizer.scrollToIndex / scrollToOffset / setOptions / measureElement 直接调用
```

### `useComponentProps(props)`

返回一个组件，把通用属性合并到默认插槽子节点（子节点已显式定义的属性优先）。少量复合组件用。

---

## 相关

- `desktop/components/form/api.md`、`desktop/components/form/types.d.ts`、`styles/index.md`（主题）
