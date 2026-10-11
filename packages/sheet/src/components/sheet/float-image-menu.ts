import type { ContextmenuItem } from '@veltra/desktop'
import { contextmenu } from '@veltra/desktop'

import type { SheetContext } from '../../tools/context'
import type { FloatContextMenuPayload } from '../../types'
import type { HyperlinkImageTarget, ImagePreviewSource, OpenHyperlinkPopup } from './popup-helpers'
import { imageLinkInitial, imagePreviewSource } from './popup-helpers'

/** 浮动图菜单注入句柄（lightbox 预览 / 图片链接弹窗由 sheet.vue 挂载，保持构建纯函数可测） */
export interface FloatImageMenuHandles {
  /** 打开 lightbox 预览；缺省时「预览」项禁用 */
  openImagePreview?: (source: ImagePreviewSource) => void
  /** 拉起图片超链接配置弹窗（image 模式）；缺省时「设置超链接」项禁用 */
  openHyperlinkPopup?: OpenHyperlinkPopup
}

/**
 * 浮动图右键独立菜单：预览 / 设置超链接 / 取消超链接（无链接不出现）/ 删除图片。
 * 设置走 hyperlink 弹窗 image 模式（确认 `updateImage(id, { link })`）；取消直写
 * `updateImage(id, { link: null })`（null 清除，可 undo）；删除走 `removeImage`
 * （命令系统，可 undo）。命中 id 不存在（并发删除）返回空数组，调用方不弹菜单。
 */
export function buildFloatImageMenus(
  ctx: SheetContext,
  id: string,
  handles?: FloatImageMenuHandles,
  options?: { readonly?: boolean }
): ContextmenuItem[] {
  const image = ctx.getImages().find((item) => item.id === id)
  if (!image) return []
  const readonly = options?.readonly === true
  const target: HyperlinkImageTarget = { kind: 'float', id }
  const items: ContextmenuItem[] = [
    {
      label: '预览',
      disabled: !handles?.openImagePreview,
      callback: () => handles?.openImagePreview?.(imagePreviewSource(image))
    },
    {
      label: '设置超链接',
      disabled: readonly || !handles?.openHyperlinkPopup,
      callback: () => handles?.openHyperlinkPopup?.('image', imageLinkInitial(image.link), target)
    },
    ...(image.link
      ? [
          {
            label: '取消超链接',
            disabled: readonly,
            callback: () => ctx.updateImage(id, { link: null })
          }
        ]
      : []),
    { label: '删除图片', disabled: readonly, callback: () => ctx.removeImage(id) }
  ]
  return items
}

/**
 * 消费引擎浮动图右键事件：按命中浮动图 link 状态构建独立菜单并经 `contextmenu.pop`
 * 弹出（viewport 坐标定位，与 body 右键菜单同口径）。右键不穿透到格菜单由引擎
 * 保证（floatObjects 命中即不派发单元格 contextmenu），此处只弹浮动图菜单。
 */
export function popFloatImageMenu(options: {
  ctx: SheetContext
  event: FloatContextMenuPayload
  handles?: FloatImageMenuHandles
  readonly?: boolean
}): void {
  const menus = buildFloatImageMenus(options.ctx, options.event.id, options.handles, {
    readonly: options.readonly
  })
  if (menus.length === 0) return
  contextmenu.pop({
    mousePosition: { x: options.event.clientX, y: options.event.clientY },
    width: 'max-content',
    menus
  })
}
