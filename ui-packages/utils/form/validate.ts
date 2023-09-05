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
  require(value: any, rule: ValidateRule['required']): string {
    if (rule === false) return ''

    const errMsg = typeof rule === 'string' ? rule : '该项不能为空'
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

  #dataRules?: ValidatorConfig<Data>['rules']

  constructor(config: ValidatorConfig<Data>) {
    this['#data'] = config.data
    this['#dataRules'] = config.rules
  }

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

  private async validateSingleData(
    data: Record<string, any>,
    field?: keyof Data | (keyof Data)[]
  ): Promise<string> {
    if (!this.#dataRules) return ''

    if (typeof field === 'string') {
      const value = data[field]
      const rules = this.#dataRules[field] as ValidateRule
      const { validator, ...normalRules } = rules

      for (const ruleName in normalRules) {
        const errMsg = validatePresets[
          ruleName as keyof typeof validatePresets
        ](value, normalRules[ruleName])
        if (errMsg) return errMsg
      }

      if (validator) {
        const errMsg = await validator(value, data)
        if (errMsg) return errMsg
      }

      return ''
    }

    if (Array.isArray(field)) {
      let i = 0
      while (i < field.length) {
        const errMsg = await this.validateSingleData(data, field[i])
        if (errMsg) return errMsg
        i++
      }
      return ''
    }

    for (const key in this.#dataRules) {
      const errMsg = await this.validateSingleData(data, key as keyof Data)
      if (errMsg) return errMsg
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

const validator = new Validator({
  data: { name: 'aaa' },
  rules: {
    name: {
      required: true,
      validator(v, data) {
        return ''
      }
    }
  }
})

// 要满足下面的用法
validator.validate('name')
