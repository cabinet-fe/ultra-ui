import { Ref, ref, watch } from 'vue'

interface ModelOptions<
  P extends Record<string, unknown>,
  N extends keyof P,
  Local extends boolean = true
> {
  /** 组件定义的属性 */
  props: P
  /** 属性名称 */
  propName?: N
  /** 事件触发函数 */
  emit: (...args: any[]) => void
  /** 是否为本地模式, 默认为true, 本地模式允许组件不受控来触发视图更新 */
  local?: Local
  /** 默认值 */
  defaultValue?: P[N]
}

/**
 * 返回一个基于提供的选项的响应式模型值。
 * 该方法在将来可能会被替代, 目前使用时为了类型提示可用
 * 如果 local 选项为true, 模型值将是响应式的，并与属性值同步。
 * 如果 local 选项为 false，则模型值将是一个代理对象，具有 getter 和 setter。当值发生更改时，它会触发一个更新事件。
 * @param options - 选项
 * @returns - 一个模型值
 */

export function useModel<
  P extends Record<string, any>,
  N extends keyof P = 'modelValue'
>(options: ModelOptions<P, N, true>): Ref<P[N]>
export function useModel<
  P extends Record<string, any>,
  N extends keyof P = 'modelValue'
>(
  options: ModelOptions<P, N, false>
): {
  __v_isRef: boolean
  value: P[N]
}
export function useModel<
  P extends Record<string, any>,
  N extends keyof P = 'modelValue',
  Local extends boolean = true
>(options: ModelOptions<P, N, Local>): any {
  // Destructure the options object
  const {
    props,
    propName = 'modelValue',
    emit,
    local = true,
    defaultValue
  } = options

  if (local) {
    const _value = props[propName] ?? defaultValue
    // 创建一个响应式对象
    const value: Ref<P[N] | undefined> =
      _value !== undefined ? ref(_value) : ref()

    // 监听属性的变更
    watch(
      () => props[propName],
      v => {
        value.value = v
      }
    )

    watch(value, v => {
      if (value !== props[propName]) {
        emit(`update:${propName as string}`, v)
      }
    })

    return value
  }

  // 创建一个拥有getter和setter的对象
  const value = {
    __v_isRef: true,

    get value(): P[N] {
      return props[propName] as P[N]
    },

    set value(v: P[N]) {
      emit(`update:${propName as string}`, v)
    }
  }

  return value
}
