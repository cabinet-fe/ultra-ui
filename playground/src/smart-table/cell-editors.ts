import { message } from '@veltra/desktop'
import type { CellValue as SheetCellValue } from '@veltra/sheet-core'
import type { GridCellEditor, GridEditorRect, GridEditorSession } from '@veltra/sheet-core/grid'

import { parseMultiValue, serializeMultiValue } from './cell-renderers'
import type { FieldType, TableField } from './types'

/**
 * 9 种字段类型的行内编辑器（挂 sheet-core 编辑器机制，编辑 UI 为原生 DOM）：
 * - text / number / progress / date / member / image：格内输入框（date 用原生日期
 *   选择，member / image 逗号分隔多值），Enter 或点击格外出提交、Esc 取消；
 * - select：下拉单选面板；multi-select：多选面板（确定提交）；Enter / Esc 同上；
 * - checkbox：无编辑浮层，点击格直接切换（切换接线在 use-smart-sheet）。
 * 提交前按类型校验，非法值提示且不落格；多值字段经序列化（JSON 字符串）提交。
 */

/** 各字段类型的编辑器注册名（use-smart-sheet 按此路由） */
export const FIELD_EDITOR_NAMES: Record<FieldType, string> = {
  text: 'smart-text',
  number: 'smart-number',
  select: 'smart-select',
  'multi-select': 'smart-multi-select',
  date: 'smart-date',
  checkbox: 'smart-checkbox',
  progress: 'smart-progress',
  member: 'smart-member',
  image: 'smart-image'
}

/** 编辑器工厂依赖：打开会话时按列读当前字段（结构变化即时生效，编辑器集不重建） */
export interface FieldEditorDeps {
  getField(col: number): TableField | undefined
}

/** 提交解析结果：ok=false 时以 message 提示且不落格 */
type Parsed = { ok: true; value: SheetCellValue | null } | { ok: false; message: string }

const parseTextInput = (_field: TableField, raw: string): Parsed => {
  const text = raw.trim()
  return { ok: true, value: text === '' ? null : text }
}

const parseNumberInput = (_field: TableField, raw: string): Parsed => {
  const text = raw.trim()
  if (text === '') return { ok: true, value: null }
  const num = Number(text)
  return Number.isFinite(num) ? { ok: true, value: num } : { ok: false, message: '请输入有效数字' }
}

const parseProgressInput = (field: TableField, raw: string): Parsed => {
  const parsed = parseNumberInput(field, raw)
  if (!parsed.ok || typeof parsed.value !== 'number') return parsed
  return parsed.value >= 0 && parsed.value <= 100
    ? parsed
    : { ok: false, message: '进度需在 0~100 之间' }
}

const parseDateInput = (_field: TableField, raw: string): Parsed => {
  const text = raw.trim()
  if (text === '') return { ok: true, value: null }
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(text))
    ? { ok: true, value: text }
    : { ok: false, message: '日期需为 YYYY-MM-DD 格式' }
}

/** member / image：逗号（含中文逗号/分号）分隔 → 非空项数组，序列化提交 */
const parseItemsInput = (_field: TableField, raw: string): Parsed => {
  const items = raw
    .split(/[,，;；]/)
    .map((item) => item.trim())
    .filter((item) => item !== '')
  return { ok: true, value: serializeMultiValue(items) }
}

/** 编辑初值 → 输入框文本：多值字段还原为逗号分隔展示 */
function toInputText(type: FieldType, value: SheetCellValue | undefined): string {
  if (value == null || value === '') return ''
  if (type === 'member' || type === 'image') return parseMultiValue(value).join(', ')
  return String(value)
}

// ─── 会话装配基建 ──────────────────────────────────────────

/** 单次会话的 DOM/监听回收（close 时由机制驱动调用） */
type Release = () => void

/** 会话内挂载编辑 UI：根元素绝对定位于表格容器，滚动跟随锚定格矩形
    （onRectChange 无退订口——会话结束即整棵 UI 回收，无泄漏） */
function mountUi(
  session: GridEditorSession,
  className: string,
  place: (root: HTMLElement, rect: GridEditorRect) => void
): { root: HTMLDivElement; release: Release } {
  const root = document.createElement('div')
  root.className = className
  place(root, session.rect)
  session.container.appendChild(root)
  session.onRectChange((rect) => place(root, rect))
  return { root, release: () => root.remove() }
}

/** 点击编辑 UI 外部时的回调（capture 挂 document） */
function onOutsidePointerDown(root: HTMLElement, handler: () => void): Release {
  const listener = (event: PointerEvent): void => {
    if (event.target instanceof Node && root.contains(event.target)) return
    handler()
  }
  document.addEventListener('pointerdown', listener, true)
  return () => document.removeEventListener('pointerdown', listener, true)
}

/** 会话只结束一次（提交/取消互斥） */
function once(action: () => void): () => void {
  let done = false
  return () => {
    if (done) return
    done = true
    action()
  }
}

/** 编辑器骨架：open 挂 UI 返回回收器，close 幂等回收 */
function sessionEditor(
  name: string,
  mount: (session: GridEditorSession) => Release | void
): GridCellEditor {
  let release: Release | null = null
  return {
    name,
    open(session) {
      release?.()
      release = mount(session) ?? null
    },
    close() {
      release?.()
      release = null
    }
  }
}

/** 格内输入框落位：与锚定格矩形重合（对齐引擎文本编辑浮层） */
function placeInCell(root: HTMLElement, rect: GridEditorRect): void {
  root.style.left = `${rect.x}px`
  root.style.top = `${rect.y}px`
  root.style.width = `${rect.width}px`
  root.style.height = `${rect.height}px`
}

/** 下拉/多选面板落位：默认格下方，下方空间不足且上方放得下时翻到格上方 */
function placePanel(session: GridEditorSession): (root: HTMLElement, rect: GridEditorRect) => void {
  return (root, rect) => {
    root.style.left = `${rect.x}px`
    root.style.minWidth = `${rect.width}px`
    const belowY = rect.y + rect.height
    if (belowY + root.offsetHeight > session.container.clientHeight && rect.y > root.offsetHeight) {
      root.style.top = `${rect.y - root.offsetHeight}px`
    } else {
      root.style.top = `${belowY}px`
    }
  }
}

// ─── 编辑器实现 ────────────────────────────────────────────

/** 格内输入框编辑器（text / number / progress / date / member / image 共用骨架） */
function createInputEditor(
  type: FieldType,
  parse: (field: TableField, raw: string) => Parsed
): (deps: FieldEditorDeps) => GridCellEditor {
  return (deps) =>
    sessionEditor(FIELD_EDITOR_NAMES[type], (session) => {
      const field = deps.getField(session.addr.col)
      if (!field) {
        session.cancel()
        return
      }
      const ui = mountUi(session, 'smart-table-editor smart-table-editor--cell', placeInCell)
      const input = document.createElement('input')
      input.type = type === 'date' ? 'date' : 'text'
      input.className = 'smart-table-editor__input'
      input.value = toInputText(type, session.value)
      ui.root.appendChild(input)

      const commit = once(() => {
        const parsed = parse(field, input.value)
        if (parsed.ok) session.commit(parsed.value)
        else {
          message.warn(parsed.message)
          session.cancel()
        }
      })
      const cancel = once(() => session.cancel())
      const detachOutside = onOutsidePointerDown(ui.root, commit)

      input.addEventListener('keydown', (event) => {
        // stopPropagation：阻止 Enter 冒泡到网格容器再触发引擎 startEdit
        // （editCellOnEnter 会把刚结束的会话原地重开一个新会话）
        if (event.key === 'Enter') {
          event.preventDefault()
          event.stopPropagation()
          commit()
        } else if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          cancel()
        }
      })
      input.focus()
      input.select()
      return () => {
        detachOutside()
        ui.release()
      }
    })
}

/** 面板空选项提示（select / multi-select 共用） */
function appendEmptyNote(list: HTMLElement): void {
  const empty = document.createElement('div')
  empty.className = 'smart-table-editor__empty'
  empty.textContent = '暂无选项'
  list.appendChild(empty)
}

/** select：下拉单选面板（点击选项即提交；方向键移动、Enter 选中、Esc/点外取消） */
function createSelectEditor(deps: FieldEditorDeps): GridCellEditor {
  return sessionEditor(FIELD_EDITOR_NAMES.select, (session) => {
    const field = deps.getField(session.addr.col)
    if (!field) {
      session.cancel()
      return
    }
    const options = field.options ?? []
    const current = session.value == null ? '' : String(session.value)
    const ui = mountUi(session, 'smart-table-editor smart-table-editor--panel', placePanel(session))
    ui.root.tabIndex = -1

    const list = document.createElement('div')
    list.className = 'smart-table-editor__list'
    ui.root.appendChild(list)

    let active = Math.max(0, options.indexOf(current))
    const rows: HTMLDivElement[] = []
    options.forEach((option) => {
      const row = document.createElement('div')
      row.className = 'smart-table-editor__option'
      row.textContent = option
      if (option === current) row.classList.add('is-selected')
      row.addEventListener('click', () => session.commit(option))
      list.appendChild(row)
      rows.push(row)
    })
    if (options.length === 0) appendEmptyNote(list)

    const cancel = once(() => session.cancel())
    const detachOutside = onOutsidePointerDown(ui.root, cancel)

    function syncActive(): void {
      rows.forEach((row, index) => row.classList.toggle('is-active', index === active))
      rows[active]?.scrollIntoView({ block: 'nearest' })
    }

    ui.root.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        event.stopPropagation()
        if (rows.length === 0) return
        active =
          event.key === 'ArrowDown'
            ? (active + 1) % rows.length
            : (active - 1 + rows.length) % rows.length
        syncActive()
      } else if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        const option = options[active]
        if (option !== undefined) session.commit(option)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        cancel()
      }
    })
    syncActive()
    ui.root.focus()
    return () => {
      detachOutside()
      ui.release()
    }
  })
}

/** multi-select：多选面板（勾选切换本地集合，确定/Enter 提交，Esc/点外取消） */
function createMultiSelectEditor(deps: FieldEditorDeps): GridCellEditor {
  return sessionEditor(FIELD_EDITOR_NAMES['multi-select'], (session) => {
    const field = deps.getField(session.addr.col)
    if (!field) {
      session.cancel()
      return
    }
    const options = field.options ?? []
    const selected = new Set(parseMultiValue(session.value))
    const ui = mountUi(session, 'smart-table-editor smart-table-editor--panel', placePanel(session))
    ui.root.tabIndex = -1

    const list = document.createElement('div')
    list.className = 'smart-table-editor__list'
    ui.root.appendChild(list)

    options.forEach((option) => {
      const label = document.createElement('label')
      label.className = 'smart-table-editor__check'
      const box = document.createElement('input')
      box.type = 'checkbox'
      box.checked = selected.has(option)
      box.addEventListener('change', () => {
        if (box.checked) selected.add(option)
        else selected.delete(option)
      })
      const text = document.createElement('span')
      text.textContent = option
      label.append(box, text)
      list.appendChild(label)
    })
    if (options.length === 0) appendEmptyNote(list)

    const footer = document.createElement('div')
    footer.className = 'smart-table-editor__footer'
    const confirm = document.createElement('button')
    confirm.type = 'button'
    confirm.className = 'smart-table-editor__confirm'
    confirm.textContent = '确定'
    footer.appendChild(confirm)
    ui.root.appendChild(footer)

    const commit = once(() => session.commit(serializeMultiValue([...selected])))
    const cancel = once(() => session.cancel())
    const detachOutside = onOutsidePointerDown(ui.root, cancel)

    confirm.addEventListener('click', commit)
    ui.root.addEventListener('keydown', (event) => {
      // stopPropagation：阻止按键冒泡到网格容器再触发引擎编辑/导航
      if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        commit()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        cancel()
      }
    })
    ui.root.focus()
    return () => {
      detachOutside()
      ui.release()
    }
  })
}

/** checkbox：无编辑浮层（双击/回车空操作，切换由点击格直接驱动） */
function createCheckboxEditor(): GridCellEditor {
  return { name: FIELD_EDITOR_NAMES.checkbox, open: (session) => session.cancel(), close: () => {} }
}

const EDITOR_FACTORIES: Record<FieldType, (deps: FieldEditorDeps) => GridCellEditor> = {
  text: createInputEditor('text', parseTextInput),
  number: createInputEditor('number', parseNumberInput),
  select: createSelectEditor,
  'multi-select': createMultiSelectEditor,
  date: createInputEditor('date', parseDateInput),
  checkbox: () => createCheckboxEditor(),
  progress: createInputEditor('progress', parseProgressInput),
  member: createInputEditor('member', parseItemsInput),
  image: createInputEditor('image', parseItemsInput)
}

/** 9 类型编辑器集合（构造一次挂 SheetGridEditorsOptions；字段经 deps 动态读取） */
export function createFieldEditors(deps: FieldEditorDeps): GridCellEditor[] {
  return (Object.keys(EDITOR_FACTORIES) as FieldType[]).map((type) => EDITOR_FACTORIES[type](deps))
}
