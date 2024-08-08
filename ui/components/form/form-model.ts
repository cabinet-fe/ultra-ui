import type {
  FormModelItem,
  ModelData,
  ModelRules,
  DataSettingConfig,
  IFormModel
} from '@ui/types/components/form'
import { Validator } from '@ui/utils'
import { getChainValue, setChainValue } from 'cat-kit/fe'
import {
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

  private modelChangeCallback?: (fields: string, val: any) => void

  constructor(fields: Fields) {
    this.fields = fields
    const rawData = {} as ModelData<Fields>
    const allKeys: string[] = []

    for (const key in fields) {
      const fieldItem = fields[key]!
      allKeys.push(key)
      const { value } = fieldItem
      const v = typeof value === 'function' ? value() : value
      setChainValue(rawData, key, v)
      setChainValue(this.preVal, key, v)
    }

    this.initialData = JSON.parse(JSON.stringify(rawData))
    const data = reactive(rawData)

    this.allKeys = allKeys
    this.data = data as ModelData<Fields>

    this.validator = new Validator(this.fields)

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

  /**
   * 监听值变更
   * @param cb 回调
   */
  onChange(cb: (field: keyof Fields, val: any) => void) {
    this.modelChangeCallback = cb
  }

  /** 关闭监听值变更 */
  offChange() {
    this.modelChangeCallback = undefined
  }
}

export class DynamicFormModel {
  /** 表单数据 */
  readonly data: Record<string, any> = reactive({})

  /** 表单规则 */
  readonly fields: Record<string, FormModelItem> = shallowReactive({})

  private validator: Validator

  /**
   * 不同表单对应的key
   */
  formKeys = new Map<number, string[]>()

  readonly errors = shallowReactive<Map<string, string[] | undefined>>(
    new Map()
  )

  /**
   * 是否在表单值更新时校验
   */
  private validateOnFieldChange = true

  private modelChangeCallback?: (fields: string, val: any) => void

  private _allKeys: string[] = []

  /** 所有的键 */
  get allKeys() {
    return this._allKeys
  }

  private getAllKeys() {
    this._allKeys = Object.keys(this.fields)
  }

  /** 初始数据 */
  private readonly initialData: Record<string, any> = {}

  /**
   * 变更前的值
   */
  private readonly oldData: Record<string, any> = {}

  constructor(fields?: Record<string, FormModelItem>) {
    this.append(fields ?? {})
    this.validator = new Validator(this.fields)
    this.getAllKeys()

    const { oldData } = this
    watch(this.data, data => {
      let changedKeys: string[] = []

      this.allKeys.forEach(key => {
        const oldVal = getChainValue(oldData, key)
        const newVal = getChainValue(data, key)
        if (oldVal !== newVal) {
          this.modelChangeCallback?.(key, newVal)
          changedKeys.push(key)
          setChainValue(oldData, key, newVal)
        }
      })

      if (this.validateOnFieldChange) {
        this.validate(changedKeys)
      } else {
        this.validateOnFieldChange = true
      }
    })
  }

  append(fields: Record<string, FormModelItem>) {
    for (const key in fields) {
      this.add(key, fields[key] ?? {})
    }
  }

  /**
   * 添加字段
   * @param field 字段
   * @param item 字段配置项
   */
  add(field: string, item: FormModelItem) {
    this.fields[field] = item
    const { value } = item
    const v = typeof value === 'function' ? value() : value
    if (v !== undefined) {
      this.initialData[field] = JSON.parse(JSON.stringify(v))
    }
    setChainValue(this.data, field, v)
    setChainValue(this.oldData, field, v)
    this.getAllKeys()
  }

  /**
   * 移除字段
   * @param field 字段
   */
  delete(field: string) {
    delete this.fields[field]
    this.getAllKeys()
  }

  /**
   * 监听值变更
   * @param cb 回调
   */
  onChange(cb: (field: string, val: any) => void) {
    this.modelChangeCallback = cb
  }

  offChange() {
    this.modelChangeCallback = undefined
  }

  async validate(fields?: string | string[]): Promise<boolean> {
    const { errors, validator, data } = this

    const results = await validator.validate(
      data,
      this.getValidateFields(fields)
    )

    // 设置错误提示
    if (!fields) {
      errors.clear()
      for (const field in results) {
        errors.set(field, results[field])
      }
    } else {
      ~(Array.isArray(fields) ? fields : [fields]).forEach(field => {
        const errs = results[field]
        if (errs?.length) {
          errors.set(field, errs)
        } else {
          errors.delete(field)
        }
      })
    }

    return errors.size > 0 ? false : true
  }

  private getValidateFields(fields?: string | string[]) {
    if (!fields) {
      if (this.formKeys.size) {
        let _fields: string[] = []
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
   * 重置数据
   * @param fields 需要重置的字段
   */
  resetData(keys?: string | string[]): void {
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
  setData(formData: Record<string, any>, config?: DataSettingConfig) {
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

  clearValidate() {
    this.errors.clear()
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
