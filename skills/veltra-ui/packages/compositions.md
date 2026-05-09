# @veltra/compositions

Vue 3 组合式函数，为组件库提供可复用的有状态逻辑。共 12 个 composable。

## 导入

```ts
import {
  useConfig,
  useFallbackProps,
  useFormFallbackProps,
  useModel,
  usePop,
  useDrag,
  useFocus,
  useVirtualizer,
  useResizeObserver,
  useReactiveSize,
  useUserAction,
  useTransition,
  useComponentProps
} from '@veltra/compositions'
```

---

## `useConfig()` — 全局配置

```ts
import { useConfig } from '@veltra/compositions'

const { config, setConfig } = useConfig()
```

### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `config` | `Readonly<State>` | 响应式只读配置对象 |
| `setConfig(conf)` | `(conf: Partial<State>) => void` | 局部更新配置 |

### `config` 结构

```ts
interface State {
  size: ComponentSize                          // 全局组件尺寸
  animation: boolean                           // 是否开启动画
  form: { labelWidth: number }                 // 表单 label 宽度
  paginator: {
    pageSize: number                           // 默认每页条数
    pageSizeOptions: number[]                  // 每页条数选项
  }
}
```

### 示例

```ts
const { config, setConfig } = useConfig()

// 全局设置
setConfig({ size: 'large', animation: false })

// 读取
console.log(config.size)             // 'large'
console.log(config.form.labelWidth)  // 100
console.log(config.paginator.pageSize) // 20
```

### `setDocumentSize(size, oldSize?)`

同步 `document.documentElement` 的 CSS class（如 `data-size="large"`）。内置调用，一般不手动使用。

---

## `useFallbackProps()` — 多级属性回退

```ts
function useFallbackProps<P extends Record<string, any>>(
  propsList: (Partial<P> | undefined | null)[],
  fallbackProps: P
): { [K in keyof P]: ComputedRef<P[K]> }
```

### 回退链

```
propsList[最后一个] → ... → propsList[0] → global config → fallbackProps
```

从右到左依次查找第一个非 `undefined` 的值。

### 示例

```vue
<script setup lang="ts">
import { useFallbackProps } from '@veltra/compositions'

const props = defineProps<{ size?: ComponentSize; disabled?: boolean }>()

const { size, disabled } = useFallbackProps(
  [props],                              // propsList
  { size: 'default', disabled: false }  // 最终默认值
)

// size: props.size → config.size → 'default'
// disabled: props.disabled → config.disabled → false
</script>

<template>
  <button :class="['btn', `btn--${size}`]" :disabled="disabled">
    <slot />
  </button>
</template>
```

### `useFormFallbackProps()` — 表单专用

```ts
function useFormFallbackProps<P extends Record<string, any>>(
  propsList: (Partial<P> | undefined | null)[],
  fallbackProps?: P  // 默认 { size: 'default', disabled: false, readonly: false }
): { [K in keyof P]: ComputedRef<P[K]> }
```

封装了表单场景最常用的回退默认值。等价于：

```ts
useFallbackProps(propsList, { size: 'default', disabled: false, readonly: false })
```

### 表单组件中的典型用法

```vue
<script setup lang="ts">
import { useFormFallbackProps } from '@veltra/compositions'
import { injectFormContext } from '../../utils/form-context'

const props = defineProps<InputProps>()

// @veltra/desktop 内部：表单上下文已下沉到 desktop/src/utils/form-context
const { formProps } = injectFormContext()

// 回退链：props → formProps → config → 默认值
const { size, disabled, readonly } = useFormFallbackProps([
  formProps ?? {},
  props
])
</script>
```

`useFormComponent` 已不再从 `@veltra/compositions` 导出。对外使用组件时只需要 `<u-form>` + `field`；维护 `@veltra/desktop` 内部表单组件时，使用 `../../utils/form-context` 的 `provideFormContext()` / `injectFormContext()`。

---

## `useModel()` — 双向绑定

```ts
function useModel<T>(options: {
  props: Record<string, any>
  emit: (...args: any[]) => void
  propName?: string              // 默认 'modelValue'
  local?: boolean | (() => boolean) // 默认 true
  shallow?: boolean
  defaultValue?: T
}): Ref<T>  // 返回自定义 ref-like 对象，可用于 v-model
```

### `local: true`（默认） — 本地副本模式

组件内部维护状态副本，变更时 emit 通知父级：

```vue
<script setup lang="ts">
import { useModel } from '@veltra/compositions'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const model = useModel({ props, emit })
// 等价于：useModel({ props, emit, propName: 'modelValue', local: true })
</script>

<template>
  <input v-model="model" />
</template>
```

### `local: false` — 纯代理模式

完全不维护本地状态，纯 getter/setter 代理 props：

```ts
const model = useModel({ props, emit, local: false })
```

### `local` 函数形式 — 运行时决定模式

```ts
// 根据 prop 动态决定是否为受控模式
const model = useModel({
  props,
  emit,
  local: () => props.modelValue !== undefined // 有外部传入则为受控
})
```

### 自定义 prop 名

```ts
// 对应 props.visible / emit('update:visible')
const visible = useModel({ props, emit, propName: 'visible' })
```

---

## `usePop()` — 浮框定位

基于 `@floating-ui/dom` 的浮框定位。

```ts
type TipDirection = 'top' | 'bottom' | 'left' | 'right'
type TipAlign = 'center' | 'start' | 'end'

function usePop(options: {
  triggerRef: ShallowRef<HTMLElement | undefined>
  contentRef: ShallowRef<HTMLElement | undefined>
  arrowRef?: ShallowRef<HTMLElement | undefined>
  /** 弹出方向，支持响应式 */
  direction?: ShallowRef<TipDirection> | TipDirection
  /** 对齐方式，支持响应式 */
  alignment?: ShallowRef<TipAlign> | TipAlign
  /** 箭头大小，默认 10 */
  arrowSize?: number
  /** 触发器元素位置变更时回调 */
  onTriggerPositionChange?: () => void
  /** 更新元素位置前回调 */
  onBeforeUpdate?: (triggerEl: HTMLElement, contentEl: HTMLElement) => void
  /** 更新元素位置后回调 */
  onAfterUpdate?: (position: ComputePositionReturn) => void
  /** 弹框弹出时回调 */
  onPop?: (position: ComputePositionReturn) => void
}): {
  update: () => Promise<void>
  popperContainerId: string
}
```

### 示例

```vue
<script setup lang="ts">
import { usePop } from '@veltra/compositions'
import { shallowRef } from 'vue'

const triggerRef = shallowRef<HTMLElement>()
const contentRef = shallowRef<HTMLElement>()

const { update } = usePop({
  triggerRef,
  contentRef,
  direction: 'bottom',
  alignment: 'center',
  onPop: (pos) => {
    console.log('弹框位置:', pos.x, pos.y)
  },
  onBeforeUpdate: (triggerEl, contentEl) => {
    // 更新前预处理
    contentEl.style.minWidth = triggerEl.offsetWidth + 'px'
  }
})
</script>

<template>
  <button ref="triggerRef" @click="visible = !visible">触发</button>
  <div v-if="visible" ref="contentRef">弹出内容</div>
</template>
```

内部使用 `computePosition` + `flip`/`shift`/`offset`/`arrow` middleware 自动计算最佳位置。
刷新父级滚动位置时自动重新定位，支持多种滚动容器。

---

## `useDrag()` — 拖拽

```ts
function useDrag(options: {
  target: Ref<HTMLElement | undefined>
  onDragStart?: (params: DragParams) => void
  onDragEnd?: (params: DragParams) => void
  onDrag?: (params: DragParams) => void
  rangeX?: { min: number; max: number }
  rangeY?: { min: number; max: number }
  initial?: { x: number; y: number }
}): {
  update: (options?: { offsetX?: number; offsetY?: number }) => void
}

interface DragParams {
  x: number
  y: number
  offsetX: number
  offsetY: number
  e: MouseEvent
}
```

### 示例

```vue
<script setup lang="ts">
import { useDrag } from '@veltra/compositions'
import { ref } from 'vue'

const sliderRef = ref<HTMLElement>()
const position = ref({ x: 0, y: 0 })

useDrag({
  target: sliderRef,
  initial: { x: 0, y: 0 },
  rangeX: { min: 0, max: 500 },
  onDrag: ({ x }) => {
    position.value.x = x
  }
})
</script>

<template>
  <div ref="sliderRef" class="slider-thumb" :style="{ left: position.x + 'px' }" />
</template>
```

---

## `useFocus()` — 焦点管理

```ts
function useFocus(onFocusChange?: (focused: boolean) => void): {
  focus: Ref<boolean>
  handleFocus: (e: FocusEvent) => void
  handleBlur: (e: FocusEvent) => void
}
```

### 示例

```vue
<script setup lang="ts">
import { useFocus } from '@veltra/compositions'

const { focus, handleFocus, handleBlur } = useFocus((focused) => {
  console.log('focus changed:', focused)
})
</script>

<template>
  <div :class="{ 'is-focused': focus }">
    <input @focus="handleFocus" @blur="handleBlur" />
  </div>
</template>
```

---

## `useVirtualizer()` — 虚拟滚动

```ts
function useVirtualizer(options: {
  // 适配 @tanstack/vue-virtual 的参数
  count: Ref<number> | number
  estimateSize?: number
  overscan?: number
  // ...
}): {
  virtualItems: Ref<Array<{ index: number; start: number; end: number; size: number }>>
  totalSize: Ref<number>
  measureElement: (el: HTMLElement | null) => void
}
```

适配层，内部基于 `@tanstack/vue-virtual`。

### 示例

```vue
<script setup lang="ts">
import { useVirtualizer } from '@veltra/compositions'
import { ref } from 'vue'

const items = ref(Array.from({ length: 10000 }, (_, i) => `Item ${i}`))
const containerRef = ref<HTMLElement>()

const { virtualItems, totalSize, measureElement } = useVirtualizer({
  count: computed(() => items.value.length),
  estimateSize: 50,
  overscan: 5
})
</script>

<template>
  <div ref="containerRef" class="container" style="height: 400px; overflow: auto">
    <div :style="{ height: totalSize + 'px', position: 'relative' }">
      <div
        v-for="virtualRow in virtualItems"
        :key="virtualRow.index"
        :ref="measureElement"
        :style="{
          position: 'absolute',
          top: 0,
          transform: `translateY(${virtualRow.start}px)`
        }"
      >
        {{ items[virtualRow.index] }}
      </div>
    </div>
  </div>
</template>
```

---

## `useResizeObserver()` — 尺寸监听

```ts
function useResizeObserver(
  target: Ref<HTMLElement | undefined>,
  callback: ResizeObserverCallback
): void
```

### 示例

```vue
<script setup lang="ts">
import { useResizeObserver } from '@veltra/compositions'
import { ref } from 'vue'

const el = ref<HTMLElement>()
const width = ref(0)

useResizeObserver(el, (entries) => {
  width.value = entries[0].contentRect.width
})
</script>

<template>
  <div ref="el">宽度: {{ width }}px</div>
</template>
```

---

## `useReactiveSize()` — 响应式尺寸

```ts
function useReactiveSize(
  target: Ref<HTMLElement | undefined>
): { width: Ref<number>; height: Ref<number> }
```

基于 `useResizeObserver` 的简化封装。

---

## `useUserAction()` — 用户动作追踪

```ts
function useUserAction(): {
  isUserAction: Ref<boolean>
  markAsUserAction: () => void
  clearUserAction: () => void
}
```

用于区分用户触发 vs 程序触发，阻断回流副作用。

---

## `useTransition()` — 过渡动画

```ts
function useTransition(options: {
  el: Ref<HTMLElement | undefined>
  enterClass?: string
  leaveClass?: string
  // ...
}): {
  enter: () => Promise<void>
  leave: () => Promise<void>
}
```

---

## `useComponentProps()` — 组件属性合并

```ts
function useComponentProps<P extends ComponentProps>(props: P): {
  // 将通用属性合并到 slot 子节点
}
```

用于将父组件的 `size` 等通用属性下发到 slot 中的子组件。

---

## 相关文档

- ../core-concepts.md — 组件通用模式，理解这些 composable 的设计意图
- desktop/components/form.md — 表单组件中使用 composable 的完整实践
- desktop/patterns.md — 组件通用 Props/Emits 模式
