import { computed, type ComputedRef } from 'vue'
import { useConfig } from '../use-config'
import type { ComponentSize } from '@ui/types/component-common'

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

type FormFallbackProps = {
  size: ComponentSize
  disabled: boolean
  readonly: boolean
}

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
    fallbackProps = {
      size: 'default',
      disabled: false,
      readonly: false
    }
  }
  return useFallbackProps(propsList, fallbackProps)
}
