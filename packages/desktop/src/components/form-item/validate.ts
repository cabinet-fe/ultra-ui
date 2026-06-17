import { isEmpty, o } from '@cat-kit/core'
import type { PresetRule, Undef, ValidateRule } from '@veltra/utils'

const presetRules: Record<PresetRule, (value: string) => string | undefined> = {
  email(v) {
    const re = /^([\w_-]+)@([\w-]+[.]?)*[\w]+\.[a-zA-Z]{2,10}$/
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
    const re = /^(ftp|https?):\/\/([\w_-]+)\.([\w-]+[.]?)*[\w]+\.[a-zA-Z]{2,10}(.*)/
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
    if (!Array.isArray(value) && typeof value !== 'string') return `${value}不是一个字符串或数组`
    if (value.length < _rule) return errMsg
  },
  maxLen(value: any, rule: ValidateRule['maxLen']): Undef<string> {
    if (isEmpty(value)) return
    let _rule = Array.isArray(rule) ? rule[0] : rule!
    let errMsg = Array.isArray(rule) ? rule[1] : `该项长度必须小于等于:${_rule}`
    if (!Array.isArray(value) && typeof value !== 'string') return `${value}不是一个字符串或数组`
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

export async function validateField(
  formData: Record<string, any>,
  field: string,
  rules: ValidateRule
): Promise<Undef<string>> {
  const value = o(formData).get(field)

  if (!rules) return

  const { validator, required, ...normalRules } = rules

  // 必填要先去校验
  if (required) {
    const err = ruleTypes.required(value, required)
    if (err) return err
  }

  // 校验规则
  for (const ruleKey in normalRules) {
    const validate = ruleTypes[ruleKey as keyof typeof ruleTypes]
    if (!validate) continue

    const err = validate(value, normalRules[ruleKey])

    if (err) return err
  }

  // 自定义校验最火校验
  if (validator) {
    const err = await validator(value, formData)
    if (err) return err
  }

  return
}
