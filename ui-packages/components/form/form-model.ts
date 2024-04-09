import type {
  FormModelItem,
  ModelData,
  ModelRules,
  IFormModel
} from '@ui/types/components/form'
import { Validator } from '@ui/utils'
import { shallowReactive, watch } from 'vue'

export class FormModel<
  Fields extends Record<string, FormModelItem> = Record<string, FormModelItem>
> implements IFormModel<Fields>
{
  readonly data: ModelData<Fields>

  readonly rules: ModelRules<Fields>
  // { [key in keyof Fields]?: string[] | undefined
  readonly errors = shallowReactive<Map<keyof Fields, string[] | undefined>>(
    new Map()
  )

  private validator: Validator<ModelRules<Fields>>

  constructor(fields: Fields) {
    const rawData = {} as ModelData<Fields>

    const rules = {} as ModelRules<Fields>

    for (const key in fields) {
      const { value, ...rule } = fields[key]!
      rawData[key] = typeof value === 'function' ? value() : value

      rules[key] = rule as any
    }

    const data = shallowReactive(rawData)

    this.data = data
    this.rules = rules
    console.log(rules, 'rules')
    this.validator = new Validator(rules)

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
      Object.keys(data).forEach(key => {
        if (p[key] !== data[key]) {
          p[key] = data[key]
        }
      })
    })
  }

  /**
   * 模型校验
   * @param fields 需要校验的字段, 不传则校验所有字段
   * @returns
   */
  async validate(fields?: keyof Fields | (keyof Fields)[]): Promise<boolean> {
    const { errors, validator, data } = this
    console.log(fields, 'fields')
    const results = await validator.validate(data, fields)

    if (!fields) {
      errors.clear()

      for (const field in results) {
        errors.set(field, results[field])

        console.log(errors, results, 'error')
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

  /** 清除校验 */
  clearValidate(): void {
    this.errors.clear()
  }
}
