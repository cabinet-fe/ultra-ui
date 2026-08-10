import { onBeforeUnmount, onMounted, shallowRef } from 'vue'

import type { SheetContext } from '../../tools/context'
import { defaultToolRegistry, type SheetTool } from '../../tools/registry'

/** 模板 ref 只读形态 */
type ElRef = { readonly value: HTMLElement | null | undefined }

/**
 * 面板打开期间的写入是否合并为一个 undo 单元（关闭时提交）：
 * 填充颜色 / 边框 / 字体颜色 / 字号参与事务；查找（每次替换独立 undo）、
 * 导出（下载侧效应，无模型写入）不参与。导入无弹层，不经此路径。
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
 * 弹层型工具编排（填充颜色 / 边框 / 查找 / 插入图片 / 导出）：
 * - popupTool：当前打开的弹层工具（null = 未打开）
 * - popupAnchor：触发按钮元素（面板定位参照，见 sheet.vue 的 left 计算）
 * - 打开 / 关闭时的事务包裹（面板期间写入合并为一个 undo 单元，关闭时提交）
 * - 点击面板外关闭（面板内 @click.stop 不冒泡到 window）
 * - Ctrl/Cmd+F 开合查找条（与工具按钮同一 toggle 逻辑）
 * 导入在 sheet.vue 特殊处理（直接系统文件选择），不经弹层。
 */
export function useToolPopup(context: SheetContext, rootEl: ElRef) {
  /** 当前打开的弹层工具（null = 未打开） */
  const popupTool = shallowRef<SheetTool | null>(null)
  /** 触发按钮元素（打开时的 currentTarget；用于面板 left 对齐按钮） */
  const popupAnchor = shallowRef<HTMLElement | null>(null)
  /** 延迟打开定时器（#23：组件卸载后不再执行 openPopup） */
  let openTimer: ReturnType<typeof setTimeout> | null = null

  function openPopup(tool: SheetTool, anchor?: HTMLElement | null): void {
    closePopup()
    popupTool.value = tool
    popupAnchor.value = anchor ?? null
    // 面板打开期间的所有写入合并为一个 undo 单元（关闭时提交）
    if (joinsTransaction(tool)) context.beginTransaction()
  }

  /**
   * 延迟到本次点击事件流结束后打开（setTimeout 宏任务，避开冒泡到 window 时
   * onWindowClick 误关——queueMicrotask 会在事件传播中途的 microtask checkpoint
   * 执行，面板会被同一 click 关闭）。保存 timer id，卸载/提前关闭时取消。
   */
  function scheduleOpen(tool: SheetTool, anchor?: HTMLElement | null): void {
    if (openTimer !== null) clearTimeout(openTimer)
    openTimer = setTimeout(() => {
      openTimer = null
      openPopup(tool, anchor)
    }, 0)
  }

  /** 关闭弹层并提交面板期间的事务（无写入则空事务，不入历史） */
  function closePopup(): void {
    if (openTimer !== null) {
      clearTimeout(openTimer)
      openTimer = null
    }
    const tool = popupTool.value
    if (!tool) return
    popupTool.value = null
    popupAnchor.value = null
    if (!joinsTransaction(tool)) return
    try {
      context.commit()
    } catch {
      context.rollback()
    }
  }

  function handleToolClick(tool: SheetTool, event?: MouseEvent): void {
    if (tool.disabled?.(context)) return
    if (tool.popup) {
      // 弹层工具：同 id 再点 = 关闭；否则延迟打开（见 scheduleOpen）
      if (popupTool.value?.id === tool.id) {
        closePopup()
        return
      }
      const anchor =
        event?.currentTarget instanceof HTMLElement ? (event.currentTarget as HTMLElement) : null
      scheduleOpen(tool, anchor)
      return
    }
    tool.onClick(context)
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
    // 仅当焦点/事件源落在本实例容器内才响应（#6）：容器外不得 preventDefault，
    // 否则劫持浏览器原生查找（页面任意位置按 Ctrl+F 都被屏蔽）；同页多实例
    // 也各只响应自己容器内的按键，不再每个实例都弹出查找条
    const root = rootEl.value
    if (root) {
      const target = event.target instanceof Node ? event.target : null
      const active = document.activeElement instanceof Node ? document.activeElement : null
      const inside =
        (target !== null && root.contains(target)) || (active !== null && root.contains(active))
      // 例外：弹层 Teleport 到 body 级 #pop-container（不在 root 内），本实例弹层
      // 打开期间焦点在弹层输入框里（如查找条内再按 Ctrl+F）——同样视为本实例的
      // 按键，否则查找条无法 toggle 关闭，且放行浏览器原生查找盖在上面。
      // （弹层打开期间点击容器外任意处会先经 onWindowClick 关闭弹层，故
      // popupTool 非空时焦点必然属于本实例，多实例不会互相抢占）
      if (!inside && popupTool.value === null) return
    }
    event.preventDefault()
    const findTool = defaultToolRegistry.get('find')
    if (!findTool) return
    if (popupTool.value?.id === findTool.id) {
      closePopup()
      return
    }
    scheduleOpen(findTool)
  }

  onMounted(() => {
    window.addEventListener('click', onWindowClick)
    window.addEventListener('keydown', onGlobalKeydown)
  })

  onBeforeUnmount(() => {
    if (openTimer !== null) {
      clearTimeout(openTimer)
      openTimer = null
    }
    closePopup()
    window.removeEventListener('click', onWindowClick)
    window.removeEventListener('keydown', onGlobalKeydown)
  })

  return { popupTool, popupAnchor, closePopup, handleToolClick }
}
