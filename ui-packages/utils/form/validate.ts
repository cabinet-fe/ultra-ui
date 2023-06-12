interface ValidateRule {
  /** 是否必填 */
  required?: boolean | string
  /** 长度单位 */
  length?: number | [number, string]
  /** 最小值 */
  min?: number | [number, string]
  /** 最大值 */
  max?: number | [number, string]
  /** 匹配 */
  match?: RegExp | [RegExp, string]
  /** 自定义校验 */
  // validator?: () => Promise<string> | string
}

/** 校验预设 */
const validatePresets = {
  require(data: any, rule: ValidateRule['required']) {
    if (data === null || data === undefined) return '该项'
    return
  }
}

interface ValidatorConfig {
  rules: Record<string, ValidateRule>
}

/**  */
class Validator {
  constructor(config: ValidatorConfig) {}


  async validate(data: any, rule: ValidateRule) {
    for (const key in rule) {
      validatePresets[key](data, rule[key])
    }
  }
}

// const validator = new Validator({
//   data: {},
//   rules: {
//     field: { required: true }
//   }
// })

// 要满足下面的用法
// validator.validate(1, { required: true })
// validator.validate('field')
// validator.validate(['field1', 'field2'])