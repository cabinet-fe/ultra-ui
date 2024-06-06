import type {
  FormModelItem,
  ModelData,
  ModelRules,
  IFormModel,
  DataSettingConfig
} from '@ui/types/components/form'
import { Validator } from '@ui/utils'
import { getChainValue, setChainValue } from 'cat-kit/fe'
import {
  nextTick,
  reactive,
  shallowReactive,
  shallowRef,
  watch,
  type ShallowRef
} from 'vue'

/**
 * 响应式表单模型
 * @example
 * ```ts
 * // 使用表单模型类你可以很容易地操作一个表单
 * const model = new FormModel({
 *   name: {
 *    value: '初始值',
 *    // 必填
 *    required: true,
 *    // 最大长度
 *    maxLen: 4
 *   },
 *   // 你也可以像下面这样指定来定一个没有初始值但是仍然标注了类型的字段
 *   age: field<string>({ required: '年龄是必填的' }),
 * })
 * ```
 */
export class FormModel<
  Fields extends Record<string, FormModelItem> = Record<string, FormModelItem>
> implements IFormModel<Fields>
{
  /** 表单数据 */
  readonly data: ModelData<Fields>

  /** 表单规则 */
  readonly rules: ModelRules<Fields>

  /** 所有的键 */
  readonly allKeys: string[]

  /** 需要校验的key */
  validateKeys?: string[]

  /** 初始数据 */
  private readonly initialData: ModelData<Fields>

  readonly errors = shallowReactive<Map<keyof Fields, string[] | undefined>>(
    new Map()
  )

  private validator: Validator<ModelRules<Fields>>

  /**
   * 是否在表单值更新时校验
   */
  private validateOnFieldChange = true

  /**
   * 变更前的值
   */
  private readonly preVal: Record<string, any> = {}

  private modelChangeCallback?: (fields: string, val: any) => void

  constructor(fields: Fields) {
    const rawData = {} as ModelData<Fields>
    const rules = {} as ModelRules<Fields>
    const allKeys: string[] = []

    for (const key in fields) {
      const { value, ...rule } = fields[key]!
      allKeys.push(key)
      const v = typeof value === 'function' ? value() : value
      setChainValue(rawData, key, v)
      setChainValue(this.preVal, key, v)

      rules[key] = rule as any
    }

    this.initialData = JSON.parse(JSON.stringify(rawData))
    const data = reactive(rawData)

    this.allKeys = allKeys
    this.data = data as ModelData<Fields>

    this.rules = rules
    this.validator = new Validator(rules)

    // 校验
    watch(data, data => {
      const { preVal } = this

      if (this.validateOnFieldChange) {
        const validateKeys: (keyof Fields)[] = []
        this.allKeys.forEach(key => {
          const v = getChainValue(data, key)

          if (getChainValue(preVal, key) !== v) {
            setChainValue(preVal, key, v)
            this.modelChangeCallback?.(key, v)
            validateKeys.push(key)
          }
        })
        this.validate(validateKeys)
      } else {
        this.allKeys.forEach(key => {
          const v = getChainValue(data, key)
          if (getChainValue(preVal, key) !== v) {
            setChainValue(preVal, key, v)
            this.modelChangeCallback?.(key, v)
          }
        })
        this.validateOnFieldChange = true
      }
    })
  }

  /**
   * 模型校验
   * @param fields 需要校验的字段, 不传则校验所有字段
   * @returns
   */
  async validate(fields?: keyof Fields | (keyof Fields)[]): Promise<boolean> {
    const { errors, validator, data } = this

    const results = await validator.validate(
      data,
      fields ?? this.validateKeys ?? this.allKeys
    )

    if (!fields) {
      errors.clear()

      for (const field in results) {
        errors.set(field, results[field])
      }
    } else {
      ~(Array.isArray(fields) ? fields : [fields]).forEach(field => {
        if (results[field]?.length) {
          errors.set(field, results[field])
        } else {
          errors.delete(field)
        }
      })
    }

    if (errors.size > 0) {
      if (typeof fields !== 'string') {
        this.scrollToFirstError()
      }
      return false
    }

    return true
  }

  /**
   * 重置数据
   * @param fields 需要重置的字段
   */
  resetData(keys?: keyof Fields | (keyof Fields)[]): void {
    if (typeof keys === 'string') {
      keys = [keys]
    } else if (Array.isArray(keys)) {
    } else {
      keys = this.allKeys
    }

    this.clearValidate()

    this.validateOnFieldChange = false

    keys.forEach(field => {
      setChainValue(
        this.data,
        field as string,
        getChainValue(this.initialData, field as string)
      )
    })
  }

  /**
   * 设置值
   * @param formData 表单值
   * @param options 配置
   */
  setData(
    formData: Partial<ModelData<Fields> & Record<string, any>>,
    config?: DataSettingConfig
  ) {
    const { validate = true } = config || {}

    if (!validate) {
      this.validateOnFieldChange = false
    }

    this.allKeys.forEach(key => {
      const value = getChainValue(formData, key)
      if (value !== undefined) {
        setChainValue(this.data, key, value)
      }
    })
  }

  /** 清除校验 */
  clearValidate(): void {
    this.errors.clear()
  }

  /** 滚动至第一个错误处 */
  scrollToFirstError(): void {
    nextTick(() => {
      const firstErrorItem = document.querySelector('.u-form-item.is-error')
      firstErrorItem?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  /**
   * 监听值变更
   * @param cb 回调
   */
  onChange(cb: (field: keyof Fields, val: any) => void) {
    this.modelChangeCallback = cb
  }
}

/**
 * 响应式表单模型
 * @param fields 响应式字段
 * @returns
 */
export function useFormModel<
  Fields extends Record<string, FormModelItem> = Record<string, FormModelItem>
>(fields: ShallowRef<Fields>) {
  const model = shallowRef<FormModel<Fields>>()

  watch(
    fields,
    fields => {
      model.value = new FormModel(fields)
    },
    { immediate: true }
  )

  return model
}
