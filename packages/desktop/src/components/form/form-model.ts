import { o } from '@cat-kit/core'
import { middleProxy, Validator } from '@ultra-ui/utils'
import { nextTick, reactive, shallowReactive, watch, type Reactive } from 'vue'

import type {
  FormModelItem,
  ModelData,
  ModelRules,
  DataSettingConfig,
  IFormModel
} from '../../types'

/**
 * 表单模型
 */
export class FormModel<
  Fields extends Record<string, FormModelItem> = Record<string, FormModelItem>
> implements IFormModel<Fields> {
  /** 表单数据 */
  data!: ModelData<Fields>

  /** 表单规则 */
  readonly fields: Fields

  /** 所有的键 */
  readonly allKeys: string[]

  /**
   * 不同表单所需要校验的字段
   * @description
   * 这个值会在表单组件渲染时由表单设置，因为只有真正渲染的组件才应该被校验
   */
  formKeys: Map<number, (keyof Fields)[]> = new Map()

  /** 初始数据 */
  readonly initialData: ModelData<Fields>

  readonly errors: Map<keyof Fields, string[] | undefined> = shallowReactive(new Map())

  private validator: Validator<ModelRules<Fields>>

  /**
   * 是否在表单值更新时校验
   */
  private validateOnFieldChange = true

  private modelChangeCallback: Set<(fields: string, val: any) => void> = new Set()

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
        watch(value, (v) => {
          o(this.initialData).set(key, v)
        })
        v = value()
      }

      o(rawData).set(key, v)
    }

    this.allKeys = allKeys
    this.initialData = JSON.parse(JSON.stringify(rawData))

    this.setProxyData(reactive(rawData))

    this.validator = new Validator(this.fields)

    return shallowReactive(this)
  }

  /**
   * 设置响应式值, 替换掉原有的数据
   * @description 设置响应式值时，会自动监听值的变化，并进行校验
   * @param proxyData 响应式的值
   */
  setProxyData(proxyData: ModelData<Fields> | Reactive<ModelData<Fields>>): void {
    const data = middleProxy(proxyData, {
      set: (field, val) => {
        this.modelChangeCallback.forEach((cb) => cb(field, val))
      },

      changed: (fields) => {
        if (!this.validateOnFieldChange) {
          this.validateOnFieldChange = true
          return
        }
        this.validate(fields)
      }
    })

    this.data = data as ModelData<Fields>
  }

  private getValidateFields(fields?: keyof Fields | (keyof Fields)[]) {
    if (!fields) {
      if (this.formKeys.size) {
        let _fields: (keyof Fields)[] = []
        this.formKeys.forEach((fields) => {
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

    const results = await validator.validate(data, this.getValidateFields(fields))

    // 全量校验
    if (!fields) {
      errors.clear()

      for (const field in results) {
        errors.set(field, results[field])
      }
    }
    // 局部校验
    else {
      ~(Array.isArray(fields) ? fields : [fields]).forEach((field) => {
        const errs = results[field]
        if (errs?.length) {
          errors.set(field, errs)
        } else {
          errors.delete(field)
        }
      })
    }

    if (errors.size > 0) {
      if (!fields) {
        nextTick(() => {
          document.querySelector('.u-form-item.is-error')?.scrollIntoView({ block: 'nearest' })
        })
      }
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

    keys.forEach((field) => {
      o(this.data).set(field as string, o(this.initialData).get(field as string))
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
  ): FormModel<Fields> {
    const { validate = true } = config || {}

    if (!validate) {
      this.validateOnFieldChange = false
    }

    this.allKeys.forEach((key) => {
      const value = o(formData).get(key)
      if (value !== undefined) {
        o(this.data).set(key, value)
      }
    })

    return this
  }

  /**
   * 设置初始值
   * @description 初始值在重置数据和查看原始数据时会用到
   * @param data 初始值
   */
  setInitialData(data: Partial<ModelData<Fields>>): FormModel<Fields> {
    this.allKeys.forEach((key) => {
      o(this.initialData).set(key, o(data).get(key))
    })

    return this
  }

  /** 清除校验 */
  clearValidate(): void {
    this.errors.clear()
  }

  /**
   * 监听值变更
   * @param cb 回调
   */
  onChange(cb: (field: keyof Fields, val: any) => void): void {
    this.modelChangeCallback.add(cb)
  }

  /** 关闭监听值变更 */
  offChange(cb: (field: keyof Fields, val: any) => void): void {
    this.modelChangeCallback.delete(cb)
  }
}
