import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref, type Ref } from 'vue'

import type { TableColumn } from '../../../../types'
import UTableEditor from '../table-editor.vue'

const columns: TableColumn[] = [
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄' },
  { key: 'city', name: '城市' }
]

const rows = [
  { name: 'Alice', age: 18, city: '杭州' },
  { name: 'Bob', age: 20, city: '上海' }
]

const mouseover = (el: Element) => el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
const focusin = (el: Element) => el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
const focusout = (el: Element) => el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))

/** 编辑态插槽：原生 input 绑定编辑态 model */
function renderNameInput(scope: any) {
  return h('input', {
    'data-test': 'name-input',
    value: scope.model.modelValue ?? '',
    onInput: (e: Event) => scope.model['onUpdate:modelValue']((e.target as HTMLInputElement).value)
  })
}

/** 文本态插槽 */
const renderNameText = (scope: any) => h('span', { 'data-test': 'name-text' }, `NAME:${scope.val}`)
const renderCityText = (scope: any) => h('span', { 'data-test': 'city-text' }, `CITY:${scope.val}`)

function mountTableEditor(slots: Record<string, any> = {}, data: Record<string, any>[] = rows) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(data) as Ref<Record<string, any>[]>
  const emitted: Record<string, any>[][] = []

  const app = createApp({
    render() {
      return h(
        UTableEditor,
        {
          columns,
          modelValue: model.value,
          'onUpdate:modelValue': (value: Record<string, any>[]) => {
            model.value = value
            emitted.push(value)
          }
        },
        slots
      )
    }
  })

  app.mount(host)

  return {
    host,
    emitted,
    getDataRows: () => [...host.querySelectorAll('tr.u-table__row')],
    getRoot: () => host.querySelector<HTMLElement>('.u-table-editor')!,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UTableEditor 单元格双态渲染', () => {
  it('初始渲染为纯文本，DOM 中不挂载编辑组件', async () => {
    const { host, getDataRows, unmount } = mountTableEditor({
      'column:name': renderNameInput,
      'text:name': renderNameText,
      'text:city': renderCityText
    })

    try {
      await nextTick()
      expect(host.querySelectorAll('[data-test="name-input"]')).toHaveLength(0)

      const [row0] = getDataRows()
      // 未提供 #text:key 的列渲染字段原始值
      expect(row0.textContent).toContain('18')
      // #text:key 覆盖文本态渲染
      expect(row0.querySelector('[data-test="name-text"]')?.textContent).toBe('NAME:Alice')
      expect(row0.querySelector('[data-test="city-text"]')?.textContent).toBe('CITY:杭州')
    } finally {
      unmount()
    }
  })

  it('悬停行挂载编辑插槽，未声明插槽的列与其它行保持文本', async () => {
    const { getDataRows, unmount } = mountTableEditor({ 'column:name': renderNameInput })

    try {
      await nextTick()
      const [row0, row1] = getDataRows()

      mouseover(row0)
      await nextTick()

      expect(row0.querySelector('[data-test="name-input"]')).toBeTruthy()
      expect(row1.querySelector('[data-test="name-input"]')).toBeFalsy()
      expect(row1.textContent).toContain('Bob')
      // 未声明 #column:key 的列始终文本渲染
      expect(row0.textContent).toContain('18')
    } finally {
      unmount()
    }
  })

  it('鼠标移出后卸载编辑组件并恢复文本', async () => {
    const { getRoot, getDataRows, unmount } = mountTableEditor({ 'column:name': renderNameInput })

    try {
      await nextTick()
      const [row0] = getDataRows()

      mouseover(row0)
      await nextTick()
      expect(row0.querySelector('[data-test="name-input"]')).toBeTruthy()

      getRoot().dispatchEvent(new MouseEvent('mouseleave'))
      await nextTick()
      expect(row0.querySelector('[data-test="name-input"]')).toBeFalsy()
      expect(row0.textContent).toContain('Alice')
    } finally {
      unmount()
    }
  })

  it('行内聚焦时移出不卸载，失焦后恢复文本', async () => {
    const { getRoot, getDataRows, unmount } = mountTableEditor({ 'column:name': renderNameInput })

    try {
      await nextTick()
      const [row0] = getDataRows()

      mouseover(row0)
      await nextTick()
      const input = row0.querySelector('input')!
      focusin(input)

      getRoot().dispatchEvent(new MouseEvent('mouseleave'))
      await nextTick()
      expect(row0.querySelector('[data-test="name-input"]')).toBeTruthy()

      focusout(input)
      await nextTick()
      expect(row0.querySelector('[data-test="name-input"]')).toBeFalsy()
      expect(row0.textContent).toContain('Alice')
    } finally {
      unmount()
    }
  })

  it('编辑态输入经 update:modelValue 写回，且不因数据回流丢焦点', async () => {
    const { getDataRows, emitted, unmount } = mountTableEditor({ 'column:name': renderNameInput })

    try {
      await nextTick()
      const [row0] = getDataRows()

      mouseover(row0)
      await nextTick()

      const input = row0.querySelector('input')!
      input.value = 'Alicia'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
      await nextTick()

      expect(emitted.at(-1)![0].name).toBe('Alicia')
      expect(row0.querySelector('[data-test="name-input"]')).toBeTruthy()
    } finally {
      unmount()
    }
  })
})

describe('UTableEditor 行操作', () => {
  it('复制/新增到下一行/删除经 update:modelValue 生效', async () => {
    const { getDataRows, emitted, unmount } = mountTableEditor()

    try {
      await nextTick()
      let dataRows = getDataRows()

      click(dataRows[0].querySelector('[title="复制到下一行"]')!)
      await nextTick()
      expect(emitted.at(-1)).toHaveLength(3)
      expect(emitted.at(-1)![1]).toEqual(rows[0])

      dataRows = getDataRows()
      click(dataRows[0].querySelector('[title="新增到下一行"]')!)
      await nextTick()
      expect(emitted.at(-1)).toEqual([rows[0], {}, rows[0], rows[1]])

      dataRows = getDataRows()
      click(dataRows[0].querySelector('[title="移除"]')!)
      await nextTick()
      expect(emitted.at(-1)).toEqual([{}, rows[0], rows[1]])
    } finally {
      unmount()
    }
  })

  it('空态展示添加按钮并新增空行', async () => {
    const { host, emitted, unmount } = mountTableEditor({}, [])

    try {
      await nextTick()
      const addBtn = [...host.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('添加')
      )
      expect(addBtn).toBeTruthy()

      click(addBtn!)
      await nextTick()
      expect(emitted.at(-1)).toEqual([{}])
    } finally {
      unmount()
    }
  })
})
