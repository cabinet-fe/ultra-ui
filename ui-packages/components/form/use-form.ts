import { provide, shallowReactive, shallowRef, type InjectionKey } from 'vue'
import type { ValidateRule } from '@ui/types/utils/form/validate'
import { Validator } from '@ui/utils'

interface FormModelItem<Val = unknown> extends ValidateRule {
  value?: Val
}

type ModelData<Model extends Record<string, FormModelItem>> = {
  [key in keyof Model]: Model[key]['value'] extends () => infer T
    ? T
    : Model[key]['value']
}

type ModelRules<Model extends Record<string, FormModelItem>> = {
  [key in keyof Model]: Omit<Model[key], 'value'>
}

/**
 * 通过传入的模型生成表单数据和校验规则
 * @param model 模型数据
 * @returns [表单数据,校验规则]
 */
function model<Model extends Record<string, FormModelItem>>(
  model: Model
): [ModelData<Model>, ModelRules<Model>] {
  const rawData = {} as ModelData<Model>

  const rules = {} as ModelRules<Model>

  for (const key in model) {
    const { value, ...rule } = model[key]!
    rawData[key] = typeof value === 'function' ? value() : value

    rules[key] = rule as any
  }

  const data = shallowReactive(rawData)

  return [data, rules]
}

/**
 * 定义表单项
 * @param item 表单项
 * @returns
 */
export function field<Val = unknown>(
  item?: FormModelItem<Val>
): FormModelItem<Val> {
  if (!item) {
    return {}
  }

  return item
}

/**
 * 使用表单
 * @param key 表单标识，用于连接上下文
 * @param modelData 模型数据
 * @returns
 */
export function useForm<Model extends Record<string, FormModelItem>>(
  modelData: Model
): [
  { data: ModelData<Model>; rules: ModelRules<Model> },
  (fields?: (keyof Model)[] | keyof Model) => Promise<boolean>
] {
  const [data, rules] = model(modelData)

  const validator = new Validator(rules)

  const errors = shallowRef<{ [key in keyof Model]?: string[] | undefined; }>()

  async function validate(
    fields?: (keyof Model)[] | keyof Model
  ): Promise<boolean> {
    errors.value = await validator.validate(data, fields)
    for (const _ in errors.value) {
      return false
    }
    return true
  }

  return [{ data, rules }, validate]
}
