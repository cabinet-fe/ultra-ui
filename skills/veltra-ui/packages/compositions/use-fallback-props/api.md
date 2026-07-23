# useFallbackProps / useFormFallbackProps - 多级属性回退

## 示例

见 `./examples.md`

## 类型

```ts
import type { ComponentSize } from '@veltra/utils'
import type { ComputedRef } from 'vue'

function useFallbackProps<F extends Record<string, any>>(
  propsList: Record<string, any>[],
  fallbackProps: F
): { [K in keyof F]: ComputedRef<F[K]> }

type FormFallbackProps = {
  size: ComponentSize
  disabled: boolean
  readonly: boolean
}

function useFormFallbackProps(
  propsList: Record<string, any>[]
): { [K in keyof FormFallbackProps]: ComputedRef<FormFallbackProps[K]> }

function useFormFallbackProps<F extends Partial<FormFallbackProps>>(
  propsList: Record<string, any>[],
  fallbackProps: F
): {
  [K in keyof F]: K extends keyof FormFallbackProps
    ? ComputedRef<FormFallbackProps[K]>
    : never
}
```

## 说明

- 优先级（从高到低）：`propsList` 从右向左第一个非 `undefined` → `useConfig()` 全局同名键 → `fallbackProps` 默认值。
- `useFormFallbackProps` 默认回退 `{ size: 'default', disabled: false, readonly: false }`；可传第二参只覆盖部分字段。
- 典型链：组件 props → formProps（`injectFormContext`）→ config → 默认值。
