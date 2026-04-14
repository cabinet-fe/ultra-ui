# use-model

```typescript
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
