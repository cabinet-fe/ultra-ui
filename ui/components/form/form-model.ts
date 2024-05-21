import type {
  FormModelItem,
  ModelData,
  ModelRules,
  IFormModel,
  DataSettingConfig
} from '@ui/types/components/form'
import { Validator } from '@ui/utils'
import {
  nextTick,
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

  /** 字段键 */
  readonly keyOfFields: (keyof Fields)[]

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

  private readonly proxyRaw: Record<string, any> = {}
  private readonly proxy: Record<string, any>

  constructor(fields: Fields) {
    const rawData = {} as ModelData<Fields>
    const rules = {} as ModelRules<Fields>
    const keyOfFields = [] as (keyof Fields)[]

    for (const key in fields) {
      const { value, ...rule } = fields[key]!
      keyOfFields.push(key)
      rawData[key] = typeof value === 'function' ? value() : value
      rules[key] = rule as any
    }

    this.initialData = JSON.parse(JSON.stringify(rawData))
    const data = shallowReactive(rawData)

    this.keyOfFields = keyOfFields
    this.data = data
    this.rules = rules
    this.validator = new Validator(rules)

    // 使用一个代理对象来在赋值时校验表单字段
    this.proxy = new Proxy(this.proxyRaw, {
      set: (t, field: string, v) => {
        t[field] = v
        this.validate(field as string)
        return true
      },

      get(t, field: string) {
        return t[field]
      }
    })

    // 校验
    watch(data, data => {
      if (!this.validateOnFieldChange) return
      const p = this.proxy

      for (const key in data) {
        if (p[key] !== data[key]) {
          p[key] = data[key]
        }
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

    const results = await validator.validate(data, fields)

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

  /** 重置数据 */
  resetData(fields?: keyof Fields | (keyof Fields)[]): void {
    if (typeof fields === 'string') {
      fields = [fields]
    } else if (Array.isArray(fields)) {
    } else {
      fields = this.keyOfFields
    }

    this.run(() => {
      fields.forEach(field => {
        const v = this.initialData[field]
        this.data[field] = v
        this.proxyRaw[field as string] = v
      })

      this.clearValidate()
    }, false)
  }

  /**
   * 设置值
   * @param formData 表单值
   * @param options 配置
   */
  setData(formData: Partial<ModelData<Fields>>, config?: DataSettingConfig) {
    const { validate } = config || {}

    this.run(() => {
      for (const key in formData) {
        if (key in this.data) {
          this.data[key] = formData[key]
          this.proxyRaw[key as string] = formData[key]
        }
      }
    }, validate)
  }

  /**
   * 执行函数
   * @param fn 待执行函数
   * @param validate 是否进行校验
   */
  async run(fn: () => void | Promise<void>, validate = true): Promise<any> {
    if (!validate) {
      this.validateOnFieldChange = false
    }

    await fn()

    if (!validate) {
      nextTick(() => {
        this.validateOnFieldChange = true
      })
    }
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
