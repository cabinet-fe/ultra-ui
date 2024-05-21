import type { IFormModel } from '@ui/types/components/form'
import { isRef, shallowRef, watch, type MaybeRef } from 'vue'

interface Options {
  /**
   * 表单模型
   * @description 可以是一个或者多个
   */
  model: MaybeRef<IFormModel | IFormModel[]>

  /**
   * 提交方法
   * @description 该方法会在表单提交时触发，并自动捕获loading状态
   */
  submit: () => Promise<void> | void
}

export function useDialogForm(options: Options) {
  const { model, submit } = options

  const loading = shallowRef(false)
  const visible = shallowRef(false)

  const getModels = (): IFormModel[] => {
    let rawModel = isRef(model) ? model.value : model
    return Array.isArray(rawModel) ? rawModel : [rawModel]
  }

  watch(visible, v => {
    if (!v) {
      const models = getModels()
      models.forEach(model => {
        model.resetData()
      })
    }
  })

  async function handleSubmit() {
    const models = getModels()

    loading.value = true

    models.forEach(model => model.clearValidate())

    const valid = (
      await Promise.all(models.map(model => model.validate()))
    ).every(v => v)

    if (!valid) {
      loading.value = false
      return
    }

    try {
      if (valid && !!submit) {
        await submit()
      }
      close()
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 是否能够提交
   */
  const readonly = shallowRef(false)

  function open(_readonly: boolean) {
    visible.value = true
    readonly.value = _readonly
  }

  function close() {
    visible.value = false
  }

  return {
    readonly,
    visible,
    open,
    close,
    handleSubmit
  }
}
