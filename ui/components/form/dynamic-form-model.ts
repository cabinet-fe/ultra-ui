import type {
  FormModelItem,
  DataSettingConfig
} from '@ui/types/components/form'
import { Validator } from '@ui/utils'
import { getChainValue, setChainValue } from 'cat-kit/fe'
import { isReactive, reactive, shallowReactive, watch } from 'vue'

/**
 * 动态表单模型
 */
export class DynamicFormModel {
  /** 表单数据 */
  private _data: Record<string, any> = reactive({})

  set data(v: Record<string, any>) {
    if (!isReactive(v)) {
      console.error(`data不是一个响应式对象`)
      return
    }
    this._data = v
    this.watchData()
  }

  get data() {
    return this._data
  }

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

  private modelChangeCallback: Set<(fields: string, val: any) => void> =
    new Set()

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
    this.watchData()
  }

  private watchData() {
    const { oldData } = this
    watch(this.data, data => {
      let changedKeys: string[] = []

      this.allKeys.forEach(key => {
        const oldVal = getChainValue(oldData, key)
        const newVal = getChainValue(data, key)
        if (oldVal !== newVal) {
          this.modelChangeCallback.forEach(cb => cb(key, newVal))
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
    /** 这是有bug的 */
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
    this.modelChangeCallback.add(cb)
  }

  offChange(cb: (field: string, val: any) => void) {
    this.modelChangeCallback.delete(cb)
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
