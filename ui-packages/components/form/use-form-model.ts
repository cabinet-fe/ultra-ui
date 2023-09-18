import { reactive } from 'vue'

type FormModelItem<Val = unknown> = {
  value?: Val
  min?: number
  max?: number
  required?: boolean
}

type ModelData<Model extends Record<string, FormModelItem>> = {
  [key in keyof Model]: Model[key]['value']
}

type ModelRules<Model extends Record<string, FormModelItem>> = {
  [key in keyof Model]: Omit<Model[key], 'value'>
}

/**
 * 通过传入的模型生成表单数据和校验规则
 * @param model 模型数据
 * @returns [表单数据,校验规则]
 */
export function useFormModel<Model extends Record<string, FormModelItem>>(
  model: Model
): [ModelData<Model>, ModelRules<Model>] {
  const rawData: Record<string, any> = {}

  const rules: Record<string, any> = {}

  for (const key in model) {
    const { value, ...rule } = model[key]!
    rawData[key] = value
    rules[key] = rule
  }

  const data = reactive(rawData)

  return [data, rules] as any
}
