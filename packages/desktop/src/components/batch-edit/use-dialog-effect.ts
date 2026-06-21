import { inject, watch } from 'vue'

import { DialogDIKey } from '../dialog/di'

interface Options {
  /** 关闭表单 */
  closeForm: () => void
}

/**
 * 在表单上的副作用。
 * 包括：关闭表单
 */
export function useDialogEffect(options: Options) {
  const dialogCtx = inject(DialogDIKey, undefined)
  if (!dialogCtx) return

  watch(dialogCtx.visible, (visible) => {
    !visible && options.closeForm?.()
  })
}
