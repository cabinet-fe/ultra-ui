import type { BEM } from '@veltra/utils'

import type { Segment } from './model'

export interface ChipDeps {
  cls: BEM<'expression-editor'>
}

export interface ChipFactoryOptions extends ChipDeps {
  /**
   * 当用户点击 chip 主体（不是 ×）时回调，由调用方决定如何打开重选面板。
   * 收到的 chipEl 当前在 DOM 中的位置即为重选锚点。
   */
  onReselect: (chipEl: HTMLElement) => void
  /** 当用户点击 × 时回调，调用方应将该 chip 从模型 / DOM 中移除。 */
  onRemove: (chipEl: HTMLElement) => void
}

const CHIP_DATA_SEG = 'var'
const CHIP_VALUE_ATTR = 'data-value'
const CHIP_TYPE_ATTR = 'data-var-type'
const CHIP_CLOSE_ATTR = 'data-chip-close'

/** 判断一个 DOM 节点是否为 chip 元素（var 段渲染体） */
export function isChipElement(node: Node | null): node is HTMLElement {
  return (
    !!node &&
    node.nodeType === 1 &&
    (node as HTMLElement).getAttribute('data-seg') === CHIP_DATA_SEG
  )
}

/** 判断点击目标是否落在 × 删除区。 */
function isCloseTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return !!target.closest(`[${CHIP_CLOSE_ATTR}]`)
}

/** 从给定 segment 创建一个 chip 元素（var 段渲染体）。 */
export function createChip(
  segment: Extract<Segment, { kind: 'var' }>,
  opts: ChipFactoryOptions
): HTMLElement {
  const { cls } = opts

  const chip = document.createElement('span')
  chip.setAttribute('data-seg', CHIP_DATA_SEG)
  chip.setAttribute(CHIP_VALUE_ATTR, segment.value)
  if (segment.type) chip.setAttribute(CHIP_TYPE_ATTR, segment.type)
  chip.setAttribute('contenteditable', 'false')
  chip.className = cls.e('chip')
  chip.title = segment.label

  const label = document.createElement('span')
  label.className = cls.e('chip-label')
  label.textContent = segment.type ? `${segment.label} (${segment.type})` : segment.label

  const close = document.createElement('span')
  close.className = cls.e('chip-close')
  close.setAttribute(CHIP_CLOSE_ATTR, 'true')
  close.setAttribute('aria-label', '删除')
  close.setAttribute('role', 'button')
  close.textContent = '×'

  chip.appendChild(label)
  chip.appendChild(close)

  chip.addEventListener('mousedown', (e) => {
    e.preventDefault()
    // 阻止冒泡：避免宿主弹框（如 dialog）的 mousedown 层级提升逻辑把 chip 打开的重选面板盖住
    e.stopPropagation()
    if (isCloseTarget(e.target)) {
      opts.onRemove(chip)
    } else {
      opts.onReselect(chip)
    }
  })

  return chip
}

/** 读取 chip 元素绑定的变量 value。 */
export function readChipValue(el: HTMLElement): string {
  return el.getAttribute(CHIP_VALUE_ATTR) ?? ''
}

/** 读取 chip 元素绑定的可选 type。 */
export function readChipType(el: HTMLElement): string | undefined {
  return el.getAttribute(CHIP_TYPE_ATTR) ?? undefined
}

/** 在 chip 上设置 / 取消选中（焦点）样式。 */
export function setChipFocused(el: HTMLElement, focused: boolean): void {
  el.classList.toggle('is-focused', focused)
}

/** 测试支持：暴露用于 DOM 选择器的属性常量。 */
export const ChipAttrs = {
  seg: 'data-seg',
  value: CHIP_VALUE_ATTR,
  type: CHIP_TYPE_ATTR,
  close: CHIP_CLOSE_ATTR
} as const
