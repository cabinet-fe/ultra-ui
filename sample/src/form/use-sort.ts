
import { nextFrame, removeStyles, setStyles } from 'ultra-ui'
import {
  shallowRef,
  type Ref,
  type ShallowRef,
  isRef,
  watchEffect,
  watch,
  nextTick,
  onBeforeUnmount
} from 'vue'

type Null<T> = T | null

// 拖拽步骤
// 在拖拽开始时保存被拖拽元素的原始信息（索引，位置）
// 进入到新的元素的位置时，记录新元素的信息（索引，位置）

interface Content {
  newIndex: number
  oldIndex: number
}

interface Options {
  /** 拖拽目标容器 */
  target:
    | HTMLElement
    | ShallowRef<HTMLElement | undefined>
    | Ref<HTMLElement | undefined>

  /** 不可拖拽的元素的类 */
  disabled?: string

  onChange?(c: Content): void

  onDrop?(): void

  /**
   * 动画持续时间，单位ms(毫秒)
   * @default 250
   */
  duration?: number
}

export function useSort(options: Options) {
  const { target, disabled, onChange, onDrop, duration = 250 } = options

  const getContainer = () => (isRef(target) ? target.value : target)

  const getTargetIndex = (target: HTMLElement) => {
    const container = getContainer()
    if (!container) return -1
    return Array.prototype.indexOf.call(container.children, target)
  }

  // 记录上一次拖拽的元素索引
  let oldIndex = -1
  let draggedNode: Null<HTMLElement> = null
  let draggedNodeRect: Null<DOMRect> = null

  const dragstartHandler = (e: DragEvent) => {
    const target = e.target as HTMLElement

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
    }

    oldIndex = getTargetIndex(target)
    draggedNode = target
    draggedNodeRect = target.getBoundingClientRect()
  }

  const sortElement = (newIndex: number) => {
    const container = getContainer()!
    if (draggedNode) {
      container.removeChild(draggedNode)
      container.insertBefore(draggedNode, container.children[newIndex]!)
    }
  }

  const dragenterHandler = (e: DragEvent) => {
    const target = e.target as HTMLElement
    if (target === draggedNode) return
    const newIndex = getTargetIndex(e.target as HTMLElement)

    onChange?.({ newIndex, oldIndex })

    sortElement(newIndex)

    animation(newIndex)
  }

  const dropHandler = (e: DragEvent) => {
    e.preventDefault()
    draggedNode && removeStyles(draggedNode, ['cursor'])
  }

  const dragoverHandler = (e: DragEvent) => {
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
      e.dataTransfer.effectAllowed = 'move'
    }
    e.preventDefault()
  }

  const mousedownHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.getAttribute('draggable') !== 'true') return
    setStyles(target, { cursor: 'grabbing' })
  }

  const addEvents = (target: HTMLElement) => {
    const children = Array.prototype.slice.call(
      target.children
    ) as HTMLElement[]

    children.forEach(child => {
      if (disabled && child.classList.contains(disabled)) return
      child.setAttribute('draggable', 'true')
    })

    target.addEventListener('dragstart', dragstartHandler)
    target.addEventListener('dragenter', dragenterHandler)
    target.addEventListener('dragover', dragoverHandler)
    target.addEventListener('drop', dropHandler)
    target.addEventListener('mousedown', mousedownHandler)
  }

  const removeEvents = (target: HTMLElement) => {
    target.removeEventListener('dragstart', dragstartHandler)
    target.removeEventListener('dragenter', dragenterHandler)
    target.removeEventListener('dragover', dragoverHandler)
    target.removeEventListener('drop', dropHandler)
    target.removeEventListener('mousedown', mousedownHandler)
  }

  if (target instanceof HTMLElement) {
    addEvents(target)
  } else if (isRef(target)) {
    watch(
      target,
      (target, oldTarget) => {
        if (target) {
          addEvents(target)
        }
      },
      { immediate: true }
    )
  }

  const animation = (newIndex: number) => {
    if (!draggedNode || newIndex === -1) return
    const target = getContainer()!.children[newIndex] as HTMLElement
    const targetRect = target.getBoundingClientRect()

    setStyles(draggedNode, {
      transform: `translate(${draggedNodeRect!.left - targetRect.left}px, ${
        draggedNodeRect!.top - targetRect.top
      }px)`
    })

    console.log(draggedNode.style.cssText)

    nextFrame(() => {
      removeStyles(draggedNode!, ['transform'])
    })
  }

  const removeAnimation = () => {}

  onBeforeUnmount(() => {
    const container = getContainer()
    container && removeEvents(container)
  })
}
