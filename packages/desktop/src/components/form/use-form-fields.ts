import { copy, o } from '@cat-kit/core'
import type { FormFieldItem } from '@veltra/utils'
import { nextTick, shallowRef, watch } from 'vue'

import type { FormProps } from '../../types/form'

interface Options {
  props: FormProps
}

/** 按快照逐字段写回 model，支持 undefined 与嵌套对象 */
function applySnapshot(target: Record<string, any>, source: Record<string, any>) {
  for (const key of Object.keys(source)) {
    const sourceValue = source[key]
    const targetValue = target[key]

    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      applySnapshot(targetValue, sourceValue)
      continue
    }

    if (Array.isArray(sourceValue)) {
      o(target).set(key, copy(sourceValue))
      continue
    }

    o(target).set(key, sourceValue)
  }
}

export function useFormFields(options: Options) {
  const { props } = options
  const fields: Record<string, FormFieldItem> = {}

  let willValidate = true

  /** model 初始快照，供 reset 恢复 */
  const initialSnapshot = shallowRef<Record<string, any> | undefined>()

  function runWithoutChangeValidate(fn: () => void) {
    willValidate = false
    fn()
    nextTick(() => {
      willValidate = true
    })
  }

  function shouldValidate() {
    return willValidate
  }

  watch(
    () => props.model,
    (model) => {
      initialSnapshot.value = model ? copy(model) : undefined
    },
    { immediate: true, deep: false }
  )

  function registerField(field: string, item: FormFieldItem) {
    fields[field] = item
  }

  function unregisterField(field: string) {
    delete fields[field]
  }

  function clearValidate() {
    Object.values(fields).forEach((item) => item.clearValidate?.())
  }

  async function validate(keys?: string[]) {
    let validList: boolean[]
    if (keys) {
      validList = await Promise.all(
        keys.map((key) => fields[key]?.validate() ?? Promise.resolve(true))
      )
    } else {
      validList = await Promise.all(Object.values(fields).map((field) => field.validate()))
    }
    return validList.every((valid) => valid)
  }

  function reset() {
    if (!props.model || !initialSnapshot.value) return

    runWithoutChangeValidate(() => {
      applySnapshot(props.model!, initialSnapshot.value!)
      Object.values(fields).forEach((item) => item.clearValidate?.())
    })
  }

  /** 变更前基准数据：优先 initialModel，否则为 model 引用变更时的快照 */
  function getBaselineModel() {
    return props.initialModel ?? initialSnapshot.value
  }

  return {
    fields,
    registerField,
    validate,
    unregisterField,
    clearValidate,
    reset,
    shouldValidate,
    getBaselineModel
  }
}
