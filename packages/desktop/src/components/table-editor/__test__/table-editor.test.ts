import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, shallowRef, ref, type Ref } from 'vue'

import type { TableColumn, TableEditorColumn } from '../../../../types'
import UTableEditor from '../table-editor.vue'

const columns: TableColumn[] = [
  { key: 'name', name: '姓名' },
  { key: 'age', name: '年龄' },
  { key: 'city', name: '城市' }
]

const ruleColumns: TableEditorColumn[] = [
  { key: 'name', name: '姓名', rules: { required: true } },
  { key: 'age', name: '年龄', rules: { min: 0 } },
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
const keydown = (el: Element, key: string, shiftKey = false) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }))

/** 编辑态插槽工厂：原生 input 绑定编辑态 model */
const renderInput = (testId: string) => (scope: any) =>
  h('input', {
    'data-test': testId,
    value: scope.model.modelValue ?? '',
    onInput: (e: Event) => scope.model['onUpdate:modelValue']((e.target as HTMLInputElement).value)
  })

const renderNameInput = renderInput('name-input')
const renderAgeInput = renderInput('age-input')

/** 文本态插槽 */
const renderNameText = (scope: any) => h('span', { 'data-test': 'name-text' }, `NAME:${scope.val}`)
const renderCityText = (scope: any) => h('span', { 'data-test': 'city-text' }, `CITY:${scope.val}`)

function mountTableEditor(
  slots: Record<string, any> = {},
  data: Record<string, any>[] = rows,
  tableColumns: TableEditorColumn[] = columns
) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const model = ref(data) as Ref<Record<string, any>[]>
  const editorRef = shallowRef<any>()
  const emitted: Record<string, any>[][] = []

  const app = createApp({
    render() {
      return h(
        UTableEditor,
        {
          ref: editorRef,
          columns: tableColumns,
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
    getEditor: () => editorRef.value,
    setModel: (value: Record<string, any>[]) => {
      model.value = value
    },
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

describe('UTableEditor 按列校验', () => {
  it('值变更实时校验，失败单元格显示错误标识，hover 以 tip 展示错误文案', async () => {
    const { getDataRows, unmount } = mountTableEditor(
      { 'column:name': renderNameInput },
      rows,
      ruleColumns
    )

    try {
      await nextTick()
      const [row0] = getDataRows()

      mouseover(row0)
      await nextTick()

      // 清空触发 required 校验失败
      const input = row0.querySelector('input')!
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
      await nextTick()

      // 错误标识包裹单元格内容，hover 触发 tip 气泡
      const errorCell = row0.querySelector('.u-table-editor__cell-error')!
      expect(errorCell).toBeTruthy()
      errorCell.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      await nextTick()
      expect(document.querySelector('.u-tip__content')?.textContent).toContain('该项不能为空')

      // 等 tip 关闭（250ms 延时）及定位异步更新完成，避免组件卸载后回调访问空元素；
      // mouseleave 不冒泡，只关闭 tip，不影响行编辑态
      errorCell.dispatchEvent(new MouseEvent('mouseleave'))
      await new Promise((resolve) => setTimeout(resolve, 300))

      // 填回合法值后错误消失
      const inputAgain = row0.querySelector('input')!
      inputAgain.value = 'Alice'
      inputAgain.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
      await nextTick()
      expect(row0.querySelector('.u-table-editor__cell-error')).toBeFalsy()
    } finally {
      unmount()
    }
  })

  it('rules 含 required 的列表头渲染红星标识', async () => {
    const { host, unmount } = mountTableEditor({}, rows, ruleColumns)

    try {
      await nextTick()
      // 仅 name 列 rules 含 required
      expect(host.querySelectorAll('.u-table-editor__required-mark')).toHaveLength(1)

      const nameHeader = [...host.querySelectorAll('th')].find((th) =>
        th.textContent?.includes('姓名')
      )
      const mark = nameHeader?.querySelector('.u-table-editor__required-mark')
      expect(mark).toBeTruthy()
      // 断言可见星号字形，而非仅节点存在
      expect(mark?.textContent).toBe('*')
    } finally {
      unmount()
    }
  })

  it('validate() 全表校验：全部通过 true，存在失败 false 并同步错误展示', async () => {
    // 用独立副本，避免与其它用例共享可变行数据
    const { getEditor, setModel, getDataRows, unmount } = mountTableEditor(
      {},
      rows.map((row) => ({ ...row })),
      ruleColumns
    )

    try {
      await nextTick()
      await expect(getEditor().validate()).resolves.toBe(true)

      setModel([{ name: '', age: 18, city: '杭州' }])
      await nextTick()
      await expect(getEditor().validate()).resolves.toBe(false)
      await nextTick()
      // validate 后失败单元格直接显示错误标识（无需悬停编辑）
      expect(getDataRows()[0].querySelector('.u-table-editor__cell-error')).toBeTruthy()

      setModel([{ name: 'Alice', age: 18, city: '杭州' }])
      await nextTick()
      await expect(getEditor().validate()).resolves.toBe(true)
    } finally {
      unmount()
    }
  })

  it('删除行后同步清理对应行的错误信息', async () => {
    const { getEditor, getDataRows, unmount } = mountTableEditor(
      {},
      [
        { name: '', age: 18, city: '杭州' },
        { name: 'Bob', age: 20, city: '上海' }
      ],
      ruleColumns
    )

    try {
      await nextTick()
      await expect(getEditor().validate()).resolves.toBe(false)
      await nextTick()
      expect(getDataRows()[0].querySelector('.u-table-editor__cell-error')).toBeTruthy()

      // 删除无错误的行，其余行的错误保留
      click(getDataRows()[1].querySelector('[title="移除"]')!)
      await nextTick()
      expect(getDataRows()[0].querySelector('.u-table-editor__cell-error')).toBeTruthy()

      // 删除有错误的行，错误随之清理
      click(getDataRows()[0].querySelector('[title="移除"]')!)
      await nextTick()
      expect(getDataRows()[0].querySelector('.u-table-editor__cell-error')).toBeFalsy()
    } finally {
      unmount()
    }
  })
})

describe('UTableEditor 录入交互', () => {
  it('新增到下一行后自动聚焦新行第一个可编辑单元格', async () => {
    const { getDataRows, unmount } = mountTableEditor({ 'column:name': renderNameInput })

    try {
      await nextTick()
      click(getDataRows()[0].querySelector('[title="新增到下一行"]')!)
      await nextTick()
      await nextTick()

      const dataRows = getDataRows()
      expect(dataRows).toHaveLength(3)
      const input = dataRows[1].querySelector('[data-test="name-input"]')!
      // 新行不在悬停态，经预置编辑态挂载输入框并聚焦
      expect(input).toBeTruthy()
      expect(document.activeElement).toBe(input)
    } finally {
      unmount()
    }
  })

  it('空态添加后自动聚焦第一个可编辑单元格', async () => {
    const { host, getDataRows, unmount } = mountTableEditor({ 'column:name': renderNameInput }, [])

    try {
      await nextTick()
      const addBtn = [...host.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('添加')
      )
      click(addBtn!)
      await nextTick()
      await nextTick()

      const input = getDataRows()[0].querySelector('[data-test="name-input"]')!
      expect(input).toBeTruthy()
      expect(document.activeElement).toBe(input)
    } finally {
      unmount()
    }
  })

  it('Tab 正向跨格移动，行末移到下一行第一个可编辑单元格', async () => {
    const { getDataRows, unmount } = mountTableEditor({
      'column:name': renderNameInput,
      'column:age': renderAgeInput
    })

    try {
      await nextTick()
      const [row0] = getDataRows()
      mouseover(row0)
      await nextTick()

      keydown(row0.querySelector('[data-test="name-input"]')!, 'Tab')
      await nextTick()
      expect(document.activeElement).toBe(row0.querySelector('[data-test="age-input"]'))

      // 行末（最后一个可编辑格）跨到下一行行首
      keydown(row0.querySelector('[data-test="age-input"]')!, 'Tab')
      await nextTick()
      await nextTick()
      const nextName = getDataRows()[1].querySelector('[data-test="name-input"]')!
      expect(nextName).toBeTruthy()
      expect(document.activeElement).toBe(nextName)
    } finally {
      unmount()
    }
  })

  it('Enter 正向移动到下一个可编辑单元格', async () => {
    const { getDataRows, unmount } = mountTableEditor({
      'column:name': renderNameInput,
      'column:age': renderAgeInput
    })

    try {
      await nextTick()
      const [row0] = getDataRows()
      mouseover(row0)
      await nextTick()

      keydown(row0.querySelector('[data-test="name-input"]')!, 'Enter')
      await nextTick()
      expect(document.activeElement).toBe(row0.querySelector('[data-test="age-input"]'))
    } finally {
      unmount()
    }
  })

  it('Shift+Tab 反向移动，行首回到上一行最后一个可编辑单元格', async () => {
    const { getDataRows, unmount } = mountTableEditor({
      'column:name': renderNameInput,
      'column:age': renderAgeInput
    })

    try {
      await nextTick()
      const dataRows = getDataRows()
      mouseover(dataRows[1])
      await nextTick()

      keydown(dataRows[1].querySelector('[data-test="name-input"]')!, 'Tab', true)
      await nextTick()
      await nextTick()
      const prevAge = dataRows[0].querySelector('[data-test="age-input"]')!
      // 上一行不在悬停态，经预置编辑态挂载输入框并聚焦
      expect(prevAge).toBeTruthy()
      expect(document.activeElement).toBe(prevAge)
    } finally {
      unmount()
    }
  })
})
