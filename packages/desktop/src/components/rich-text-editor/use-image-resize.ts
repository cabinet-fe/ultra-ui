import {
  $createNodeSelection,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  KEY_ESCAPE_COMMAND,
  type LexicalEditor
} from 'lexical'
import { onBeforeUnmount, type ShallowRef, watch } from 'vue'

import { $isImageNode } from './image-node'

const WRAP_SELECTOR = '[data-rte-image-key]'
const HANDLE_SELECTOR = '.u-rte-image-resizer'
const MIN_WIDTH = 24

const captureOptions = { capture: true } as AddEventListenerOptions

function swallowClick(event: Event): void {
  event.preventDefault()
  event.stopPropagation()
}

/**
 * 图片选中与拖拽缩放（参考 Lexical playground ImagesPlugin / ImageResizer）：
 * - 点击图片设置 NodeSelection 并标记选中态（wrapper 加 is-selected）
 * - 拖拽右下角手柄等比缩放，实时改写 img 内联尺寸，松手时写入节点
 * - Esc 取消选中；Backspace / Delete 删除走 Lexical 原生 NodeSelection 通路
 * 选中态在每次 editor 更新后重放，避免撤销 / 内容重设后 class 失效。
 */
export function useImageResize(
  editor: ShallowRef<LexicalEditor | null>,
  canEdit: () => boolean
): void {
  let selectedKey: string | null = null
  let cleanupFns: (() => void)[] = []

  function syncSelectionClass(ed: LexicalEditor) {
    const root = ed.getRootElement()
    if (!root) return
    root.querySelectorAll('.u-rte-image-wrap.is-selected').forEach((element) => {
      element.classList.remove('is-selected')
    })
    if (selectedKey) ed.getElementByKey(selectedKey)?.classList.add('is-selected')
  }

  function setup(ed: LexicalEditor) {
    cleanupFns.push(
      ed.registerCommand(
        CLICK_COMMAND,
        (event) => {
          if (!canEdit()) return false
          const key = (event.target as HTMLElement)
            .closest?.(WRAP_SELECTOR)
            ?.getAttribute('data-rte-image-key')
          if (!key) return false
          event.preventDefault()
          ed.update(() => {
            if (!$isImageNode($getNodeByKey(key))) return
            const selection = $createNodeSelection()
            selection.add(key)
            $setSelection(selection)
          })
          return true
        },
        COMMAND_PRIORITY_HIGH
      ),
      ed.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (!selectedKey) return false
          ed.update(() => {
            if ($isNodeSelection($getSelection())) $setSelection(null)
          })
          return true
        },
        COMMAND_PRIORITY_HIGH
      ),
      ed.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection()
          selectedKey = $isNodeSelection(selection)
            ? (selection.getNodes().find($isImageNode)?.getKey() ?? null)
            : null
        })
        syncSelectionClass(ed)
      })
    )

    const root = ed.getRootElement()
    if (!root) return

    const onPointerDown = (event: PointerEvent) => {
      if (!canEdit() || event.button !== 0) return
      const handle = (event.target as HTMLElement).closest?.(HANDLE_SELECTOR)
      const wrapper = handle?.closest(WRAP_SELECTOR)
      const img = wrapper?.querySelector('img')
      if (!wrapper || !img) return
      event.preventDefault()

      const key = wrapper.getAttribute('data-rte-image-key')
      const style = getComputedStyle(root)
      const maxWidth =
        root.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      const ratio = img.clientHeight / img.clientWidth
      const startX = event.clientX
      const startWidth = img.clientWidth
      // 真实输入下捕获指针保证拖出编辑区仍可跟踪；合成事件（自动化测试）无活跃
      // 指针，setPointerCapture 会抛 NotFoundError，降级为仅监听 root 内移动
      try {
        root.setPointerCapture(event.pointerId)
      } catch {
        // ignore
      }

      const onPointerMove = (moveEvent: PointerEvent) => {
        const width = Math.min(
          maxWidth,
          Math.max(MIN_WIDTH, Math.round(startWidth + moveEvent.clientX - startX))
        )
        img.style.width = `${width}px`
        img.style.height = `${Math.round(width * ratio)}px`
      }
      const finish = (upEvent: PointerEvent) => {
        root.removeEventListener('pointermove', onPointerMove)
        root.removeEventListener('pointerup', finish)
        root.removeEventListener('pointercancel', finish)
        if (root.hasPointerCapture(upEvent.pointerId)) root.releasePointerCapture(upEvent.pointerId)
        // pointer capture 使松手 target 落在编辑区内，浏览器随派发的 click 会把
        // 图片选中换成文本光标；吞掉这次拖拽尾随的 click
        root.addEventListener('click', swallowClick, { capture: true, once: true })
        setTimeout(() => root.removeEventListener('click', swallowClick, captureOptions), 0)
        if (!key) return
        ed.update(() => {
          const node = $getNodeByKey(key)
          if (!$isImageNode(node)) return
          node.setWidthAndHeight(img.clientWidth, img.clientHeight)
          // 松手后保持图片选中，方便继续微调或删除
          const selection = $createNodeSelection()
          selection.add(key)
          $setSelection(selection)
        })
      }
      root.addEventListener('pointermove', onPointerMove)
      root.addEventListener('pointerup', finish)
      root.addEventListener('pointercancel', finish)
    }
    root.addEventListener('pointerdown', onPointerDown)
    cleanupFns.push(() => root.removeEventListener('pointerdown', onPointerDown))
  }

  watch(
    editor,
    (ed) => {
      if (ed) setup(ed)
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    cleanupFns.forEach((fn) => fn())
    cleanupFns = []
    selectedKey = null
  })
}
