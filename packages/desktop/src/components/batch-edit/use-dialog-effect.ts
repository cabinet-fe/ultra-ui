import { inject, watch } from 'vue'

import { DialogDIKey } from '../dialog/di'

interface Options {
  /** 关闭表单 */
  closeForm: () => void
}

/**
 * 在表单上的副作用。
 * 包括：关闭表单
 *
 * sync 触发：弹框关闭会随即卸载表单组件，默认 pre 时序下 watcher 可能随组件卸载被丢弃
 */
export function useDialogEffect(options: Options) {
  const dialogCtx = inject(DialogDIKey, undefined)
  if (!dialogCtx) return

  watch(
    dialogCtx.visible,
    (visible) => {
      !visible && options.closeForm?.()
    },
    { flush: 'sync' }
  )
}
