import type {
  ValidateResult,
  ValidateRule,
  Data,
  ValidatorConfig
} from '@ui/types/utils/form/validate'

/** 预设规则 */
const presetRules = {
  required(value: any, required: ValidateRule['required']): string {
    if (required === false) return ''

    const errMsg = typeof required === 'string' ? required : '该项不能为空'
    if (value === null || value === undefined) return errMsg

    if (Array.isArray(value) && !value.length) return errMsg
    if (typeof value === 'string' && !value) return errMsg

    return ''
  },
  min(value: any, rule: ValidateRule['min']): string {
    if (value === null || value === undefined) return ''
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项必须大于等于${_rule}`
    if (typeof value !== 'number') return `${value}不是一个数字`
    if (value < _rule) return errMsg
    return ''
  },
  max(value: any, rule: ValidateRule['max']): string {
    if (value === null || value === undefined) return ''
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项必须小于等于${_rule}`
    if (typeof value !== 'number') return `${value}不是一个数字`
    if (value > _rule) return errMsg
    return ''
  },

  minLen(value: any, rule: ValidateRule['minLen']): string {
    if (value === null || value === undefined) return ''
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项长度必须大于等于${_rule}`
    if (!Array.isArray(value) && typeof value !== 'string')
      return `${value}不是一个字符串或数组`
    if (value.length < _rule) return errMsg
    return ''
  },
  maxLen(value: any, rule: ValidateRule['maxLen']): string {
    if (value === null || value === undefined) return ''
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项长度必须小于等于:${_rule}`
    if (!Array.isArray(value) && typeof value !== 'string')
      return `${value}不是一个字符串或数组`
    if (value.length > _rule) return errMsg
    return ''
  },
  match(value: any, rule: ValidateRule['match']): string {
    if (value === null || value === undefined) return ''
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项不匹配正则:${_rule}`
    if (typeof value !== 'string') return `${value}不是一个字符串`
    if (!_rule.test(value)) return errMsg
    return ''
  }
}

/**  */
export class Validator<
  Rules extends Record<string, ValidateRule> = Record<string, ValidateRule>,
  Fields extends keyof Rules = keyof Rules
> {
  #rules: Rules

  #errorsDict: { [key in Fields]?: string[] } = {}

  #config?: ValidatorConfig

  constructor(rules: Rules, config?: ValidatorConfig) {
    this.#rules = rules
    if (config) {
      this.#config = config
    }
  }

  private _existRules?: boolean

  private get existRules() {
    if (this._existRules !== undefined) {
      return this._existRules
    }
    return Object.keys(this.#rules).length > 0
  }

  /**
   * 校验单条数据
   * @param data 数据
   */
  private async validateSingleData(
    data: Record<any, any>,
    fields?: Fields | Fields[]
  ): Promise<string> {
    let errMsg = ''
    if (!this.existRules) return errMsg
    const lazy = this.#config?.lazy ?? true

    const rulesKeys = (
      fields
        ? Array.isArray(fields)
          ? fields
          : [fields]
        : Object.keys(this.#rules)
    ) as Fields[]

    for (let i = 0; i < rulesKeys.length; i++) {
      const key = rulesKeys[i]!
      const rules = this.#rules[key]
      const value = data[key]
      const { validator, ...normalRules } = rules!
      for (const ruleKey in normalRules) {
        errMsg = presetRules[ruleKey](value, normalRules[ruleKey])

        if (errMsg) return errMsg
      }

      if (validator) {
        errMsg = await validator(value, data)
        if (errMsg) return errMsg
      }
    }

    return errMsg
  }

  /**
   * 校验多条数据
   * @param field 需要校验的字段
   */
  private async validateManyData(
    data: Data,
    field?: Fields | Fields[]
  ): Promise<string> {
    let i = 0
    while (i < data.length) {
      const item = data[i]!
      const errMsg = await this.validateSingleData(item, field)
      if (errMsg) return errMsg
      i++
    }

    return ''
  }

  /**
   * 校验
   * @param data 数据
   * @param fields 字段
   * @returns
   */
  async validate(
    data: Data,
    fields?: Fields | Fields[]
  ): Promise<ValidateResult> {
    const errMsg = await (Array.isArray(data)
      ? this.validateManyData(data, fields)
      : this.validateSingleData(data, fields))

    return {
      success: !errMsg,
      errMsg
    }
  }
}
