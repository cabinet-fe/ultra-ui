import type {
  FormModelItem,
  ModelData,
  ModelRules,
  IFormModel
} from '@ui/types/components/form'
import { Validator } from '@ui/utils'
import { nextTick, shallowReactive, watch } from 'vue'

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
    const p = new Proxy(
      {},
      {
        set: (t, field, v) => {
          t[field] = v
          this.validate(field as string)
          return true
        },

        get(t, field) {
          return t[field]
        }
      }
    )

    watch(data, data => {
      if (!this.validateOnFieldChange) return
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

    if (errors.size > 0) return false

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

    // 重置时不再校验数据了
    this.validateOnFieldChange = false

    fields.forEach(field => {
      this.data[field] = this.initialData[field]
    })

    this.clearValidate()

    nextTick(() => {
      this.validateOnFieldChange = true
    })
  }

  /**
   * 设置值
   * @param formData 表单值
   */
  setData(formData: Partial<ModelData<Fields>>) {
    for (const key in formData) {
      if (key in this.data) {
        this.data[key] = formData[key]
      }
    }
  }

  /** 清除校验 */
  clearValidate(): void {
    this.errors.clear()
  }
}
