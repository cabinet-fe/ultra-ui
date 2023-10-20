type ValidatorData = Record<string, any> | Record<string, any>[]

interface ValidateRule<
  Value extends any = any,
  Data extends Record<string, any> = Record<string, any>
> {
  /** 是否必填 */
  required?: boolean | string
  /** 长度单位 */
  length?: number | [number, string]
  /** 最小值 */
  min?: number | [number, string]
  /** 最大值 */
  max?: number | [number, string]
  /** 最小长度 */
  minLen?: number | [number, string]
  /** 最大长度 */
  maxLen?: number | [number, string]
  /** 匹配 */
  match?: RegExp | [RegExp, string]
  /** 自定义校验 */
  validator?: (value: Value, data: Data) => Promise<string> | string
}

/** 校验预设 */
const validatePresets = {
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

interface ValidatorConfig<Data extends ValidatorData> {
  data: Data
  rules?: Data extends Record<string, any>[]
    ? { [key in keyof Data[number]]?: ValidateRule<Data[number][key], Data> }
    : { [key in keyof Data]?: ValidateRule<Data[key], Data> }
}

/**  */
export class Validator<Data extends ValidatorData> {
  #data: Data

  #rules?: ValidatorConfig<Data>['rules']

  constructor(config: ValidatorConfig<Data>) {
    this.#data = config.data
    this.#rules = config.rules
  }

  /**
   * 校验单条数据
   * @param data 数据
   */
  private async validateSingleData(data: Record<string, any>): Promise<string> {
    let errMsg = ''
    if (!this.#rules) return errMsg

    for (const key in this.#rules) {
      // 单个字段的规则
      const fieldRules = this.#rules[key]

      if (!(key in data)) {
        console.warn(`字段${key}不存在, 这可能会引起一些错误`)
        continue
      }
      const value = data[key]

      for (const ruleKey in fieldRules) {
        errMsg = validatePresets[ruleKey as keyof ValidateRule](
          value,
          fieldRules[ruleKey as string]
        )
        console.log(errMsg)
      }
    }

    return ''
  }

  /**
   * 校验多条数据
   * @param field 需要校验的字段
   */
  private async validateManyData(
    field?: keyof Data | (keyof Data)[]
  ): Promise<string> {
    const data = this.#data as Record<string, any>[]
    let i = 0
    while (i < data.length) {
      const item = data[i]!
      const errMsg = await this.validateSingleData(item, field)
      if (errMsg) return errMsg
      i++
    }

    return ''
  }

  async validate(field: keyof Data): Promise<boolean>
  async validate(): Promise<boolean>
  async validate(field: (keyof Data)[]): Promise<boolean>
  async validate(field?: keyof Data | (keyof Data)[]): Promise<boolean> {
    if (Array.isArray(this.#data)) {
      const errMsg = await this.validateManyData(field)
      return errMsg ? false : true
    }

    const errMsg = await this.validateSingleData(this.#data, field)

    return errMsg ? false : true
  }
}
