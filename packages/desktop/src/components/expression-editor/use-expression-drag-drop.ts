import { $getNodeByKey, $getRoot, type LexicalEditor, type LexicalNode } from 'lexical'

import {
  EXPRESSION_DROP_SCOPE_ATTR,
  EXPRESSION_VARIABLE_DRAG_KEY_ATTR,
  EXPRESSION_VARIABLE_DRAG_MARKER_ATTR,
  EXPRESSION_VARIABLE_DRAG_TYPE
} from './constants'
import { VariableNode } from './nodes/variable-node'

type Direction = -1 | 1

interface DragVisualState {
  indicatorEl: HTMLDivElement | null
  sourceEl: HTMLElement | null
  cleanupDragEnd: (() => void) | null
  activePayload: InternalDragPayload | null
}

interface DropAnchor {
  x: number
  y: number
  height: number
}

export interface VariableNodeDescriptor {
  key: string
  variable: string
  label: string
}

export interface InternalDragPayload {
  sourceKey: string
  scopeId: string
  action: 'move-variable'
}

export interface ApplyDropReorderOptions {
  payloadText: string | null
  scopeId: string
  targetSlot: number
  focusMovedNode?: boolean
}

const DROP_INDICATOR_CLASS = 'expression-editor__drop-indicator'
const DRAG_SOURCE_CLASS = 'is-dragging'

const dragVisualStateMap = new WeakMap<LexicalEditor, DragVisualState>()

function getDragVisualState(editor: LexicalEditor): DragVisualState {
  const existing = dragVisualStateMap.get(editor)
  if (existing) return existing

  const created: DragVisualState = {
    indicatorEl: null,
    sourceEl: null,
    cleanupDragEnd: null,
    activePayload: null
  }
  dragVisualStateMap.set(editor, created)
  return created
}

function isHTMLElement(target: EventTarget | null): target is HTMLElement {
  return target instanceof HTMLElement
}

function hasChildren(
  node: LexicalNode
): node is LexicalNode & { getChildren: () => LexicalNode[] } {
  return typeof (node as { getChildren?: unknown }).getChildren === 'function'
}

function traverseVariableNodes(node: LexicalNode, collector: VariableNodeDescriptor[]): void {
  if (node instanceof VariableNode) {
    collector.push({ key: node.getKey(), variable: node.getVariable(), label: node.getLabel() })
    return
  }

  if (!hasChildren(node)) return
  node.getChildren().forEach((child) => traverseVariableNodes(child, collector))
}

function $collectVariableNodeDescriptors(): VariableNodeDescriptor[] {
  const collector: VariableNodeDescriptor[] = []
  const root = $getRoot()
  traverseVariableNodes(root, collector)
  return collector
}

function getDropIndicator(rootElement: HTMLElement): HTMLDivElement {
  const existing = rootElement.querySelector<HTMLDivElement>(`.${DROP_INDICATOR_CLASS}`)
  if (existing) return existing

  const indicator = document.createElement('div')
  indicator.className = DROP_INDICATOR_CLASS
  indicator.style.opacity = '0'
  rootElement.appendChild(indicator)
  return indicator
}

function getDropAnchors(editor: LexicalEditor): DropAnchor[] {
  const descriptors = collectVariableNodeDescriptors(editor)
  if (descriptors.length === 0) return []

  const rects = descriptors
    .map((descriptor) => editor.getElementByKey(descriptor.key))
    .filter((element): element is HTMLElement => element instanceof HTMLElement)
    .map((element) => element.getBoundingClientRect())

  if (rects.length === 0) return []

  const anchors: DropAnchor[] = []
  const first = rects[0]!
  anchors.push({ x: first.left, y: first.top, height: first.height })

  for (let index = 0; index < rects.length - 1; index++) {
    const currentRect = rects[index]!
    const nextRect = rects[index + 1]!
    anchors.push({
      x: (currentRect.right + nextRect.left) / 2,
      y: (currentRect.top + nextRect.top) / 2,
      height: Math.max(currentRect.height, nextRect.height)
    })
  }

  const last = rects[rects.length - 1]!
  anchors.push({ x: last.right, y: last.top, height: last.height })

  return anchors
}

function getDistance(pointerX: number, pointerY: number, anchor: DropAnchor): number {
  const dx = pointerX - anchor.x
  const dy = pointerY - (anchor.y + anchor.height / 2)
  return dx * dx + dy * dy
}

export function supportsNativeDnD(): boolean {
  if (typeof window === 'undefined') return false

  const probe = document.createElement('span')
  const hasDragApi = 'draggable' in probe && typeof DataTransfer !== 'undefined'
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false

  return hasDragApi && !coarsePointer
}

export function collectVariableNodeDescriptors(editor: LexicalEditor): VariableNodeDescriptor[] {
  let descriptors: VariableNodeDescriptor[] = []
  editor.getEditorState().read(() => {
    descriptors = $collectVariableNodeDescriptors()
  })
  return descriptors
}

export function ensureDropScopeId(editor: LexicalEditor): string {
  const rootElement = editor.getRootElement()
  if (!rootElement) return ''

  const existing = rootElement.getAttribute(EXPRESSION_DROP_SCOPE_ATTR)
  if (existing) return existing

  const generated = `scope-${Math.random().toString(36).slice(2)}`
  rootElement.setAttribute(EXPRESSION_DROP_SCOPE_ATTR, generated)
  return generated
}

export function findVariableDragSource(target: EventTarget | null): HTMLElement | null {
  if (!isHTMLElement(target)) return null

  return target.closest<HTMLElement>(`[${EXPRESSION_VARIABLE_DRAG_MARKER_ATTR}="true"]`)
}

export function readDragSourceKey(target: EventTarget | null): string | null {
  const source = findVariableDragSource(target)
  if (!source) return null

  return source.getAttribute(EXPRESSION_VARIABLE_DRAG_KEY_ATTR)
}

export function createInternalDragPayload(payload: InternalDragPayload): string {
  return JSON.stringify(payload)
}

export function writeInternalDragPayload(
  dataTransfer: DataTransfer | null,
  payload: InternalDragPayload
): void {
  if (!dataTransfer) return
  dataTransfer.setData(EXPRESSION_VARIABLE_DRAG_TYPE, createInternalDragPayload(payload))
}

export function parseInternalDragPayload(payloadText: string | null): InternalDragPayload | null {
  if (!payloadText) return null

  try {
    const parsed = JSON.parse(payloadText) as Partial<InternalDragPayload>
    if (
      parsed.action !== 'move-variable' ||
      typeof parsed.scopeId !== 'string' ||
      parsed.scopeId.length === 0 ||
      typeof parsed.sourceKey !== 'string' ||
      parsed.sourceKey.length === 0
    ) {
      return null
    }

    return { action: parsed.action, scopeId: parsed.scopeId, sourceKey: parsed.sourceKey }
  } catch {
    return null
  }
}

export function readInternalDragPayload(
  dataTransfer: DataTransfer | null
): InternalDragPayload | null {
  if (!dataTransfer) return null
  return parseInternalDragPayload(dataTransfer.getData(EXPRESSION_VARIABLE_DRAG_TYPE))
}

export function beginDragVisualState(
  editor: LexicalEditor,
  sourceEl: HTMLElement | null,
  payload?: InternalDragPayload
): void {
  const state = getDragVisualState(editor)
  clearDragVisualState(editor)
  state.activePayload = payload ?? null

  if (!sourceEl) return
  sourceEl.classList.add(DRAG_SOURCE_CLASS)
  state.sourceEl = sourceEl

  const onDragEnd = () => {
    clearDragVisualState(editor)
  }
  window.addEventListener('dragend', onDragEnd, true)
  state.cleanupDragEnd = () => {
    window.removeEventListener('dragend', onDragEnd, true)
  }
}

export function getActiveInternalDragPayload(editor: LexicalEditor): InternalDragPayload | null {
  return getDragVisualState(editor).activePayload
}

export function showDropIndicator(editor: LexicalEditor, slot: number): void {
  const rootElement = editor.getRootElement()
  if (!rootElement) return

  const anchors = getDropAnchors(editor)
  if (slot < 0 || slot >= anchors.length) {
    clearDropIndicator(editor)
    return
  }

  const anchor = anchors[slot]!
  const indicator = getDropIndicator(rootElement)
  const rootRect = rootElement.getBoundingClientRect()

  indicator.style.left = `${anchor.x - rootRect.left}px`
  indicator.style.top = `${anchor.y - rootRect.top}px`
  indicator.style.height = `${anchor.height}px`
  indicator.style.opacity = '1'

  const state = getDragVisualState(editor)
  state.indicatorEl = indicator
}

export function clearDropIndicator(editor: LexicalEditor): void {
  const state = getDragVisualState(editor)
  if (!state.indicatorEl) return
  state.indicatorEl.style.opacity = '0'
}

export function clearDragVisualState(editor: LexicalEditor): void {
  const state = getDragVisualState(editor)

  if (state.sourceEl) {
    state.sourceEl.classList.remove(DRAG_SOURCE_CLASS)
    state.sourceEl = null
  }

  if (state.indicatorEl) {
    state.indicatorEl.style.opacity = '0'
    state.indicatorEl = null
  }

  if (state.cleanupDragEnd) {
    state.cleanupDragEnd()
    state.cleanupDragEnd = null
  }

  state.activePayload = null
}

export function autoScrollWhenNearEdge(container: HTMLElement, pointerY: number): void {
  const rect = container.getBoundingClientRect()
  const threshold = 24
  const step = 10

  if (pointerY < rect.top + threshold) {
    container.scrollBy({ top: -step, behavior: 'auto' })
    return
  }

  if (pointerY > rect.bottom - threshold) {
    container.scrollBy({ top: step, behavior: 'auto' })
  }
}

export function resolveDropSlot(editor: LexicalEditor, event: DragEvent): number | null {
  const rootElement = editor.getRootElement()
  if (!rootElement || !isHTMLElement(event.target)) return null
  if (!rootElement.contains(event.target)) return null

  const anchors = getDropAnchors(editor)
  if (anchors.length === 0) return null

  let nearestSlot = 0
  let nearestDistance = Number.POSITIVE_INFINITY
  for (let slot = 0; slot < anchors.length; slot++) {
    const anchor = anchors[slot]!
    const distance = getDistance(event.clientX, event.clientY, anchor)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestSlot = slot
    }
  }

  return nearestSlot
}

export function reorderVariableNode(
  sourceKey: string,
  targetSlot: number,
  focusMovedNode = true
): boolean {
  const nodes = $collectVariableNodeDescriptors()
  if (nodes.length <= 1) return false

  const sourceIndex = nodes.findIndex((item) => item.key === sourceKey)
  if (sourceIndex < 0) return false
  if (targetSlot < 0 || targetSlot > nodes.length) return false
  if (targetSlot === sourceIndex || targetSlot === sourceIndex + 1) return false

  const sourceNode = $getNodeByKey(sourceKey)
  if (!(sourceNode instanceof VariableNode)) return false

  const remaining = nodes.filter((item) => item.key !== sourceKey)
  const insertionIndex = targetSlot > sourceIndex ? targetSlot - 1 : targetSlot
  const reference = remaining[insertionIndex]

  if (reference) {
    const referenceNode = $getNodeByKey(reference.key)
    if (!(referenceNode instanceof VariableNode)) return false
    referenceNode.insertBefore(sourceNode)
  } else {
    const last = remaining[remaining.length - 1]
    if (!last) return false
    const lastNode = $getNodeByKey(last.key)
    if (!(lastNode instanceof VariableNode)) return false
    lastNode.insertAfter(sourceNode)
  }

  if (focusMovedNode) {
    sourceNode.selectEnd()
  }

  return true
}

export function moveVariableByDirection(
  sourceKey: string,
  direction: Direction,
  focusMovedNode = true
): boolean {
  const nodes = $collectVariableNodeDescriptors()
  const sourceIndex = nodes.findIndex((item) => item.key === sourceKey)
  if (sourceIndex < 0) return false

  const targetIndex = sourceIndex + direction
  if (targetIndex < 0 || targetIndex >= nodes.length) return false

  const targetSlot = direction === -1 ? targetIndex : targetIndex + 1
  return reorderVariableNode(sourceKey, targetSlot, focusMovedNode)
}

export function applyDropReorder(options: ApplyDropReorderOptions): boolean {
  const payload = parseInternalDragPayload(options.payloadText)
  if (!payload) return false
  if (payload.scopeId !== options.scopeId) return false

  return reorderVariableNode(payload.sourceKey, options.targetSlot, options.focusMovedNode ?? true)
}
