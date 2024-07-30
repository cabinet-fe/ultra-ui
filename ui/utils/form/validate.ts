import type { Undef } from '@ui/types/helper'
import type {
  ValidateRule,
  Data,
  ValidatorConfig,
  PresetRule
} from '@ui/types/utils/form/validate'
import { getChainValue } from 'cat-kit/fe'

const isEmpty = (value: any): value is null | undefined => {
  return value === null || value === undefined
}

const presetRules: Record<PresetRule, (value: string) => string | undefined> = {
  email(v) {
    const re = /^([\w\_\-]+)@([\w\-]+[\.]?)*[\w]+\.[a-zA-Z]{2,10}$/
    if (!re.test(v)) {
      return '邮箱格式不正确'
    }
  },
  phone(v) {
    const re = /^\d{11}$/
    if (!re.test(v)) {
      return '手机号格式不正确'
    }
  },
  num(v) {
    const re = /^\d+$/
    if (!re.test(v)) {
      return '数字格式不正确'
    }
  },
  url(v) {
    const re =
      /^(ftp|https?)\:\/\/([\w\_\-]+)\.([\w\-]+[\.]?)*[\w]+\.[a-zA-Z]{2,10}(.*)/
    if (!re.test(v)) {
      return '链接格式不正确'
    }
  },

  idCard(v) {
    const re = /^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/
    if (!re.test(v)) {
      return '身份证格式不正确'
    }
  }
}

/** 预设规则 */
const ruleTypes = {
  required(value: any, required: ValidateRule['required']): Undef<string> {
    if (required === false) return

    const errMsg = typeof required === 'string' ? required : '该项不能为空'
    if (isEmpty(value)) return errMsg

    if (Array.isArray(value) && !value.length) return errMsg
    if (typeof value === 'string' && !value) return errMsg
  },
  min(value: any, rule: ValidateRule['min']): Undef<string> {
    if (isEmpty(value)) return
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项必须大于等于${_rule}`
    if (typeof value !== 'number') return `${value}不是一个数字`
    if (value < _rule) return errMsg
  },
  max(value: any, rule: ValidateRule['max']): Undef<string> {
    if (isEmpty(value)) return
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项必须小于等于${_rule}`
    if (typeof value !== 'number') return `${value}不是一个数字`
    if (value > _rule) return errMsg
  },

  minLen(value: any, rule: ValidateRule['minLen']): Undef<string> {
    if (isEmpty(value)) return
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项长度必须大于等于${_rule}`
    if (!Array.isArray(value) && typeof value !== 'string')
      return `${value}不是一个字符串或数组`
    if (value.length < _rule) return errMsg
  },
  maxLen(value: any, rule: ValidateRule['maxLen']): Undef<string> {
    if (isEmpty(value)) return
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项长度必须小于等于:${_rule}`
    if (!Array.isArray(value) && typeof value !== 'string')
      return `${value}不是一个字符串或数组`
    if (value.length > _rule) return errMsg
  },
  match(value: any, rule: ValidateRule['match']): Undef<string> {
    if (isEmpty(value) || value === '') return
    if (typeof rule === 'string') {
      if (!rule) return
      rule = new RegExp(rule)
    }
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项不匹配正则:${_rule}`
    if (typeof value !== 'string') return `${value}不是一个字符串`
    if (!_rule.test(value)) return errMsg
  },
  preset(value: any, rule: ValidateRule['preset']): Undef<string> {
    if (isEmpty(value) || value === '' || !rule) return
    if (typeof value !== 'string') return `${value}不是一个字符串`
    const ruleValidator = presetRules[rule]
    return ruleValidator(value)
  }
}
/**  */
export class Validator<
  Rules extends Record<string, ValidateRule> = Record<string, ValidateRule>,
  Field extends keyof Rules = keyof Rules
> {
  protected rules: Rules

  private config?: ValidatorConfig

  constructor(rules: Rules, config?: ValidatorConfig) {
    this.rules = rules
    if (config) {
      this.config = config
    }
  }

  /** 是否存在规则 */
  private get existRules() {
    for (const _ in this.rules) {
      return true
    }
    return false
  }

  /**
   * 校验单条数据
   * @param data 数据
   */
  private async validateSingleData(
    data: Record<any, any>,
    fields?: Field | Field[]
  ): Promise<{ [key in Field]?: string[] }> {
    const fieldErrors: { [key in Field]?: string[] } = {}

    if (!this.existRules) return fieldErrors

    const lazy = this.config?.lazy ?? true

    fields = fields
      ? Array.isArray(fields)
        ? fields
        : [fields]
      : (Object.keys(this.rules) as Field[])

    // 懒校验，当有一个规则不通过，剩下的规则不再校验
    if (lazy) {
      // 校验字段
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i]!
        const errors = await this.validateValueLazy(data, field)
        if (errors.length === 0) continue
        fieldErrors[field] = errors
      }
      return fieldErrors
    } else {
      // 校验字段
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i]!
        const errors = await this.validateValue(data, field)
        if (errors.length === 0) continue
        fieldErrors[field] = errors
      }

      return fieldErrors
    }
  }

  private async validateValue(data: Record<any, any>, field: Field) {
    const rules = this.rules[field]!
    const value = getChainValue(data, field as string)

    const { validator, required, ...normalRules } = rules

    let errors: string[] = []

    // 必填要先去校验
    if (required) {
      const err = ruleTypes.required(value, required)
      err && errors.push(err)
    }

    // 校验规则
    for (const ruleKey in normalRules) {
      const validate = ruleTypes[ruleKey]
      if (!validate) continue
      const err = validate(value, normalRules[ruleKey])
      err && errors.push(err)
    }

    // 自定义校验最火校验
    if (validator) {
      const err = await validator(value, data)
      err && errors.push(err)
    }

    return errors
  }

  private async validateValueLazy(
    data: Record<any, any>,
    field: Field
  ): Promise<string[]> {
    const rules = this.rules[field]
    const value = getChainValue(data, field as string)
    let errors: string[] = []

    if (!rules) return errors

    const { validator, required, ...normalRules } = rules

    // 必填要先去校验
    if (required) {
      const err = ruleTypes.required(value, required)
      if (err) {
        errors.push(err)
        return errors
      }
    }

    // 校验规则
    for (const ruleKey in normalRules) {
      const validate = ruleTypes[ruleKey]
      if (!validate) continue

      const err = validate(value, normalRules[ruleKey])

      if (err) {
        errors.push(err)
        return errors
      }
    }

    // 自定义校验最火校验
    if (validator) {
      const err = await validator(value, data)
      if (err) {
        errors.push(err)
        return errors
      }
    }

    return errors
  }

  /**
   * 校验多条数据
   * @param field 需要校验的字段
   */
  private async validateManyData(
    data: Data,
    field?: Field | Field[]
  ): Promise<{ [key in Field]?: string[] }> {
    let i = 0
    while (i < data.length) {
      const item = data[i]!
      const fieldErrors = await this.validateSingleData(item, field)
      if (Object.keys(fieldErrors).length > 0) {
        return fieldErrors
      }
      i++
    }

    return {}
  }

  /**
   * 校验
   * @param data 数据
   * @param fields 字段
   * @returns
   */
  async validate(
    data: Data,
    fields?: Field | Field[]
  ): Promise<{ [key in Field]?: string[] }> {
    return Array.isArray(data)
      ? this.validateManyData(data, fields)
      : this.validateSingleData(data, fields)
  }
}

export class DynamicValidator extends Validator<
  Record<string, ValidateRule>,
  string
> {
  constructor(rules?: Record<string, ValidateRule>, config?: ValidatorConfig) {
    super(rules ?? {}, config)
  }

  /**
   * 添加规则
   * @param field 字段
   * @param rule 规则
   */
  addRule(field: string, rule: ValidateRule) {
    this.rules[field] = rule
  }

  /**
   * 删除规则
   * @param field 字段
   */
  deleteRule(field: string) {
    delete this.rules[field]
  }
}
