# 共享类型

```typescript
import type { DeconstructValue } from '@veltra/utils'

/** 动画组件属性 */
export interface AnimationProps {
  /**
   * 标签元素
   * @default 'div'
   */
  tag?: string

  inView?: Record<string, any>
}

/** 动画组件定义的事件 */
export interface AnimationEmits {
  (e: 'update:modelValue', value: string): void
}

/** 动画组件暴露的属性和方法(组件内部使用) */
export interface _AnimationExposed {}

/** 动画组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AnimationExposed = DeconstructValue<_AnimationExposed>
```

---

```typescript
import type { DeconstructValue } from '@veltra/utils'

/** 过渡组件属性 */
export interface CssTransitionProps {
  /** 类名称，和vue的transition组件类似 */
  name: string
  /** 是否激活 */
  active?: boolean
}

/** 过渡组件定义的事件 */
export interface CssTransitionEmits {
  /** 过渡进入动画结束 */
  (e: 'after-enter'): void
  /** 过渡离开动画结束 */
  (e: 'after-leave'): void
  /** 离开过渡动画取消 */
  (e: 'leave-canceled'): void
  /** 进入过渡动画取消 */
  (e: 'enter-canceled'): void
}

/** 过渡组件暴露的属性和方法(组件内部使用) */
export interface _CssTransitionExposed {
  /**
   * 切换过渡状态
   * @param active 是否激活. true激活，false未激活
   */
  toggle(active: boolean): void
  /**
   * 切换过渡状态
   * @param activeAction 激活函数，通过返回值来确定是否激活
   */
  toggle(activeAction: (active: boolean) => boolean): void
}

/** 过渡组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CssTransitionExposed = DeconstructValue<_CssTransitionExposed>
```

---

```typescript
import type { DeconstructValue } from '@veltra/utils'

/** 气泡弹框组件属性 */
export interface PopProps {
  modelValue?: string
}

/** 气泡弹框组件定义的事件 */
export interface PopEmits {
  (e: 'update:modelValue', value: string): void
}

/** 气泡弹框组件暴露的属性和方法(组件内部使用) */
export interface _PopExposed {}

/** 气泡弹框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PopExposed = DeconstructValue<_PopExposed>
```

---

```typescript
import type { DeconstructValue } from '@veltra/utils'

/** 快速批量编辑组件属性 */
export interface QuickBatchEditProps {
  modelValue?: string
}

/** 快速批量编辑组件定义的事件 */
export interface QuickBatchEditEmits {
  (e: 'update:modelValue', value: string): void
}

/** 快速批量编辑组件暴露的属性和方法(组件内部使用) */
export interface _QuickBatchEditExposed {}

/** 快速批量编辑组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type QuickBatchEditExposed = DeconstructValue<_QuickBatchEditExposed>
```

---

```typescript
import type { DeconstructValue } from '@veltra/utils'

/** 多量自动完成组件组件属性 */
export interface MultiAutoCompleteProps {
  modelValue?: string
}

/** 多量自动完成组件组件定义的事件 */
export interface MultiAutoCompleteEmits {
  (e: 'update:modelValue', value: string): void
}

/** 多量自动完成组件组件暴露的属性和方法(组件内部使用) */
export interface _MultiAutoCompleteExposed {}

/** 多量自动完成组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MultiAutoCompleteExposed = DeconstructValue<_MultiAutoCompleteExposed>
```

---

```typescript
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** text-editor组件属性 */
export interface BarType {
  content: string
  bar: string
}

export interface TextEditorProps extends FormComponentProps {
  modelValue?: string
  placeholder?: string
  toolbar?: BarType[]
}

/** text-editor组件定义的事件 */
export interface TextEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** text-editor组件暴露的属性和方法(组件内部使用) */
export interface _TextEditorExposed {}

/** text-editor组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TextEditorExposed = DeconstructValue<_TextEditorExposed>
```
