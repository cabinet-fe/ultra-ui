import type {
  FormModelItem,
  ModelData,
  ModelRules,
  IFormModel
} from '@ui/types/components/form'
import { Validator } from '@ui/utils'
import { shallowReactive, shallowRef, watch } from 'vue'

export class FormModel<
  Fields extends Record<string, FormModelItem> = Record<string, FormModelItem>
> implements IFormModel<Fields>
{
  readonly data: ModelData<Fields>

  readonly rules: ModelRules<Fields>

  readonly errors =
    shallowRef<{ [key in keyof Fields]?: string[] | undefined }>()

  private validator: Validator

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
   * @returns
   */
  async validate(fields: keyof Fields | (keyof Fields)[]): Promise<boolean> {
    console.log(fields)
    const { errors, validator, data } = this
    errors.value = await validator.validate(data, fields)

    for (const _ in errors.value) {
      return false
    }
    return true
  }

  clearValidate(): void {
    this.errors.value = undefined
  }
}
