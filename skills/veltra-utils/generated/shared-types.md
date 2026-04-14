# @veltra/utils — 共享常量与类型源码

```typescript
/** 命名前缀 */
export const NAME_SPACE = 'U'

/** 类前缀 */
export const CLS_PREFIX = `${NAME_SPACE.toLowerCase()}-` as 'u-'

/** 表单空内容 */
export const FORM_EMPTY_CONTENT = '-'
```

---

```typescript
export * from './constants'
```

---

```typescript
export type ComponentSize = 'small' | 'default' | 'large'

export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** 断点名称 */
export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** 组件通用属性 */
export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

/** 表单组件通用属性 */
export interface FormComponentProps extends ComponentProps {
  /** 在表单控件内时的提示 */
  tips?: string
  /** 所占列的大小 */
  span?:
    | number
    | 'full'
    | ({
        [key in BreakpointName]?: 'full' | number
      } & { default: number | 'full' })
  /** 表单标签文字 */
  label?: string
  /** 表单项字段 */
  field?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
}

/** 带有服务端交互功能的组件属性 */
export interface PropsWithServerQuery {
  /** 请求接口地址 */
  api?: string
  /** 请求查询参数 */
  query?: Record<string, any>
}
```

---

```typescript
/** 表单 provide/inject 上下文（完整 props 见 @veltra/desktop/types/form） */
export type FormContextInjectProps = Record<string, unknown>
```

---

```typescript
import type { VNode } from 'vue'

export type Null<T> = null | T

export type Undef<T> = undefined | T

/** 自定义事件, 可以指定target类型 */
export interface DefineEvent<T = HTMLElement> extends Omit<Event, 'target'> {
  target: T
}

/** 解构VueExpose中被引用的实例 */
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** 索引类型 */
export type Index<Keys extends string, Val> = {
  [key in Keys]?: Val
}

/**
 * 渲染函数返回内容
 */
export type RenderReturn =
  | (undefined | VNode | string | null | number)[]
  | undefined
  | VNode
  | string
  | null
  | number
```

---

```typescript
export * from './helper'
export * from './component-common'
export * from './form-context'
export * from './utils/form/validate'
```

---

```typescript
export type Data = Record<string, any>

export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

/** 字段校验规则 */
export interface ValidateRule {
  /** 是否必填 */
  required?: boolean | string
  /** 长度单位 */
  length?: number | [number, string]
  /** 最小值 */
  min?: number | [number, string]
  /** 最大值 */
  max?: number | [number, string]
  /** 最小长度 */
  minLen?: number | [number, string]
  /** 最大长度 */
  maxLen?: number | [number, string]
  /** 匹配 */
  match?: RegExp | [RegExp, string] | string
  /** 预设 */
  preset?: PresetRule
  /** 自定义校验 */
  validator?: (value: any, data: Data) => Promise<string> | string
}

export interface ValidatorConfig {
  /**
   * 是否懒校验，为true时在任意一个字段的的任意规则校验不通过时立马结束校验，性能稍微高一点，但是不能得出所有的错误
   * @default true
   */
  lazy?: boolean
}
```
