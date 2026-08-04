import { onBeforeUnmount, onMounted, shallowRef } from 'vue'

import type { SheetContext } from '../tools/context'
import { defaultToolRegistry, type SheetTool } from '../tools/registry'

/**
 * 面板打开期间的写入是否合并为一个 undo 单元（关闭时提交）：
 * 填充颜色 / 边框 / 字体颜色 / 字号参与事务；查找（每次替换独立 undo）、导入 /
 * 导出（下载侧效应，无模型写入）不参与。
 */
function joinsTransaction(tool: SheetTool): boolean {
  return (
    tool.popup === 'fill-color' ||
    tool.popup === 'border' ||
    tool.popup === 'font-color' ||
    tool.popup === 'font-size'
  )
}

/**
 * 弹层型工具编排（填充颜色 / 边框 / 查找 / 导入 / 导出）：
 * - popupTool：当前打开的弹层工具（null = 未打开）
 * - 打开 / 关闭时的事务包裹（面板期间写入合并为一个 undo 单元，关闭时提交）
 * - 点击面板外关闭（面板内 @click.stop 不冒泡到 window）
 * - Ctrl/Cmd+F 开合查找条（与工具按钮同一 toggle 逻辑）
 */
export function useToolPopup(context: SheetContext) {
  /** 当前打开的弹层工具（null = 未打开） */
  const popupTool = shallowRef<SheetTool | null>(null)

  function openPopup(tool: SheetTool): void {
    closePopup()
    popupTool.value = tool
    // 面板打开期间的所有写入合并为一个 undo 单元（关闭时提交）
    if (joinsTransaction(tool)) context.beginTransaction()
  }

  /** 关闭弹层并提交面板期间的事务（无写入则空事务，不入历史） */
  function closePopup(): void {
    const tool = popupTool.value
    if (!tool) return
    popupTool.value = null
    if (!joinsTransaction(tool)) return
    try {
      context.commit()
    } catch {
      context.rollback()
    }
  }

  function handleToolClick(tool: SheetTool): void {
    if (tool.disabled?.(context)) return
    if (tool.popup) {
      // 弹层工具：同 id 再点 = 关闭；否则延迟打开（setTimeout 宏任务，避开
      // 本次点击冒泡到 window 时 onWindowClick 误关——queueMicrotask 会在
      // 事件传播中途的 microtask checkpoint 执行，面板会被同一 click 关闭）
      if (popupTool.value?.id === tool.id) {
        closePopup()
        return
      }
      setTimeout(() => openPopup(tool), 0)
      return
    }
    tool.onClick(context)
  }

  /**
   * 打开弹层型工具（右键菜单等非工具栏入口；与 handleToolClick 一致用 setTimeout
   * 延迟到本次点击事件流结束后，避免 onWindowClick 误关）。
   */
  function openToolPopup(tool: SheetTool | undefined): void {
    if (!tool || tool.disabled?.(context)) return
    setTimeout(() => openPopup(tool), 0)
  }

  /**
   * 点击面板外任意处关闭。面板内部 @click.stop 不冒泡到 window；
   * 触发按钮本身的点击由 handleToolClick 同步处理（打开/关闭 toggle），
   * 冒泡到达这里时 popupTool 已更新，不会误关。
   */
  function onWindowClick(): void {
    if (!popupTool.value) return
    closePopup()
  }

  /** Ctrl/Cmd+F 打开 / 关闭查找条（与工具按钮同一 toggle 逻辑） */
  function onGlobalKeydown(event: KeyboardEvent): void {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'f') return
    event.preventDefault()
    const findTool = defaultToolRegistry.get('find')
    if (!findTool) return
    if (popupTool.value?.id === findTool.id) {
      closePopup()
      return
    }
    setTimeout(() => openPopup(findTool), 0)
  }

  onMounted(() => {
    window.addEventListener('click', onWindowClick)
    window.addEventListener('keydown', onGlobalKeydown)
  })

  onBeforeUnmount(() => {
    closePopup()
    window.removeEventListener('click', onWindowClick)
    window.removeEventListener('keydown', onGlobalKeydown)
  })

  return { popupTool, openPopup, closePopup, handleToolClick, openToolPopup }
}
