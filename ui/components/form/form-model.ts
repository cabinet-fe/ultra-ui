import type {
  FormModelItem,
  ModelData,
  ModelRules,
  DataSettingConfig,
  IFormModel
} from '@ui/types/components/form'
import { Validator } from '@ui/utils'
import { getChainValue, setChainValue } from 'cat-kit/fe'
import { reactive, shallowReactive, watch } from 'vue'

/**
 * 表单模型
 */
export class FormModel<
  Fields extends Record<string, FormModelItem> = Record<string, FormModelItem>
> implements IFormModel<Fields>
{
  /** 表单数据 */
  readonly data: ModelData<Fields>

  /** 表单规则 */
  readonly fields: Fields

  /** 所有的键 */
  readonly allKeys: string[]

  /**
   * 不同表单对应的key
   */
  formKeys = new Map<number, (keyof Fields)[]>()

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

  private modelChangeCallback: Set<(fields: string, val: any) => void> =
    new Set()

  constructor(fields: Fields) {
    this.fields = fields
    const rawData = {} as ModelData<Fields>
    const allKeys: string[] = []

    for (const key in fields) {
      const fieldItem = fields[key]!
      allKeys.push(key)
      const { value } = fieldItem
      let v = value

      if (typeof value === 'function') {
        watch(value, v => {
          setChainValue(this.initialData, key, v)
        })
        v = value()
      }

      setChainValue(rawData, key, v)
      setChainValue(this.preVal, key, v)
    }

    this.initialData = JSON.parse(JSON.stringify(rawData))
    const data = reactive(rawData)

    this.allKeys = allKeys
    this.data = data as ModelData<Fields>

    this.validator = new Validator(this.fields)

    // 根据新旧值变化校验
    watch(data, data => {
      const { preVal } = this

      if (this.validateOnFieldChange) {
        const validateKeys: (keyof Fields)[] = []
        this.allKeys.forEach(key => {
          const v = getChainValue(data, key)

          if (getChainValue(preVal, key) !== v) {
            setChainValue(preVal, key, v)
            this.modelChangeCallback.forEach(cb => cb(key, v))
            validateKeys.push(key)
          }
        })
        this.validate(validateKeys)
      } else {
        this.allKeys.forEach(key => {
          const v = getChainValue(data, key)
          if (getChainValue(preVal, key) !== v) {
            setChainValue(preVal, key, v)
            this.modelChangeCallback.forEach(cb => cb(key, v))
          }
        })
        this.validateOnFieldChange = true
      }
    })
  }

  private getValidateFields(fields?: keyof Fields | (keyof Fields)[]) {
    if (!fields) {
      if (this.formKeys.size) {
        let _fields: (keyof Fields)[] = []
        this.formKeys.forEach(fields => {
          _fields = _fields.concat(fields)
        })
        return _fields
      } else {
        return this.allKeys
      }
    }

    if (!Array.isArray(fields)) {
      return [fields]
    }
    return fields
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
      this.getValidateFields(fields)
    )

    // 全量校验
    if (!fields) {
      errors.clear()

      for (const field in results) {
        errors.set(field, results[field])
      }
    }
    // 局部校验
    else {
      ~(Array.isArray(fields) ? fields : [fields]).forEach(field => {
        const errs = results[field]
        if (errs?.length) {
          errors.set(field, errs)
        } else {
          errors.delete(field)
        }
      })
    }

    if (errors.size > 0) {
      return Promise.reject(false)
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

  /**
   * 监听值变更
   * @param cb 回调
   */
  onChange(cb: (field: keyof Fields, val: any) => void) {
    this.modelChangeCallback.add(cb)
  }

  /** 关闭监听值变更 */
  offChange(cb: (field: keyof Fields, val: any) => void) {
    this.modelChangeCallback.delete(cb)
  }
}
