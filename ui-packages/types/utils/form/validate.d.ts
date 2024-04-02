export type Data = Record<string, any> | Record<string, any>[]

/** 字段校验规则 */
export interface ValidateRule {
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
  validator?: (value: any, data: Data) => Promise<string> | string
}

export interface ValidatorConfig {
  /**
   * 是否懒校验，为true时在任意一个字段的的任意规则校验不通过时立马结束校验，性能稍微高一点，但是不能得出所有的错误
   * @default true
   */
  lazy?: boolean
}
