// @vitest-environment happy-dom

import { describe, expect, it } from 'vite-plus/test'
import { createApp, h, nextTick, shallowRef, ref, type Ref } from 'vue'

import type { TableColumn, TableEditorColumn } from '../../../../types'
import { UInput } from '../../input'
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

const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))

/** 编辑列插槽工厂：原生 input 展开插槽 model（含 change 校验钩子）并绑定值 */
const renderInput = (testId: string) => (scope: any) =>
  h('input', {
    ...scope.model,
    'data-test': testId,
    value: scope.model.modelValue ?? '',
    onInput: (e: Event) => scope.model['onUpdate:modelValue']((e.target as HTMLInputElement).value)
  })

const renderNameInput = renderInput('name-input')
const renderAgeInput = renderInput('age-input')

function mountTableEditor(
  slots: Record<string, any> = {},
  data: Record<string, any>[] = rows,
  tableColumns: TableEditorColumn[] = columns,
  extraProps: Record<string, any> = {}
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
          ...extraProps,
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
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

const findHeader = (host: Element, text: string) =>
  [...host.querySelectorAll('th')].find((th) => th.textContent?.includes(text))

describe('UTableEditor 行内编辑', () => {
  it('初始渲染即挂载编辑控件，未声明插槽的列渲染字段原始值', async () => {
    const { host, getDataRows, unmount } = mountTableEditor({
      'column:name': renderNameInput,
      'column:age': renderAgeInput
    })

    try {
      await nextTick()
      expect(host.querySelectorAll('[data-test="name-input"]')).toHaveLength(2)
      expect(host.querySelectorAll('[data-test="age-input"]')).toHaveLength(2)

      const [row0] = getDataRows()
      expect(row0.textContent).toContain('杭州')
    } finally {
      unmount()
    }
  })

  it('编辑输入经 update:modelValue 写回，且不因数据回流丢焦点', async () => {
    // 用独立副本，编辑写回的是行对象本身，避免污染模块级共享数据
    const { getDataRows, emitted, unmount } = mountTableEditor(
      { 'column:name': renderNameInput },
      rows.map((row) => ({ ...row }))
    )

    try {
      await nextTick()
      const [row0] = getDataRows()

      const input = row0.querySelector('input')!
      input.focus()
      input.value = 'Alicia'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
      await nextTick()

      expect(emitted.at(-1)![0].name).toBe('Alicia')
      expect(document.activeElement).toBe(input)
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

describe('UTableEditor 只读模式', () => {
  it('输入控件经插槽 model 收到 readonly', async () => {
    const { getDataRows, unmount } = mountTableEditor(
      { 'column:name': renderNameInput },
      rows.map((row) => ({ ...row })),
      columns,
      { readonly: true }
    )

    try {
      await nextTick()
      const inputs = getDataRows().map((tr) => tr.querySelector('input')!)
      expect(inputs).toHaveLength(2)
      for (const input of inputs) expect(input.hasAttribute('readonly')).toBe(true)
    } finally {
      unmount()
    }
  })

  it('库输入控件（u-input）只读下按展示态渲染值，不可修改', async () => {
    const { getDataRows, emitted, unmount } = mountTableEditor(
      { 'column:name': (scope: any) => h(UInput, scope.model) },
      rows.map((row) => ({ ...row })),
      columns,
      { readonly: true }
    )

    try {
      await nextTick()
      const [row0] = getDataRows()
      expect(row0.querySelector('input')).toBeFalsy()
      expect(row0.textContent).toContain('Alice')
      expect(emitted).toHaveLength(0)
    } finally {
      unmount()
    }
  })

  it('不渲染操作列：无「操作」表头与单元格操作按钮', async () => {
    const { host, unmount } = mountTableEditor({}, rows, columns, { readonly: true })

    try {
      await nextTick()
      expect(findHeader(host, '操作')).toBeFalsy()
      expect(host.querySelector('[title="移除"]')).toBeFalsy()
      expect(host.querySelector('[title="新增到下一行"]')).toBeFalsy()
      expect(host.querySelector('[title="复制到下一行"]')).toBeFalsy()
    } finally {
      unmount()
    }
  })

  it('空表时不渲染「添加」按钮', async () => {
    const { host, emitted, unmount } = mountTableEditor({}, [], columns, { readonly: true })

    try {
      await nextTick()
      const addBtn = [...host.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('添加')
      )
      expect(addBtn).toBeFalsy()
      expect(emitted).toHaveLength(0)
    } finally {
      unmount()
    }
  })
})

describe('UTableEditor 按列校验', () => {
  it('编辑列 change 时触发校验，输入（update）过程不校验；错误见表头列级指示', async () => {
    // 用独立副本，编辑写回的是行对象本身，避免污染模块级共享数据
    const { host, getDataRows, unmount } = mountTableEditor(
      { 'column:name': renderNameInput },
      rows.map((row) => ({ ...row })),
      ruleColumns
    )

    try {
      await nextTick()
      const [row0] = getDataRows()
      const headerText = () =>
        findHeader(host, '姓名')?.querySelector('.u-table-editor__header-text')
      const nameCellError = () =>
        row0.querySelector('[data-test="name-input"]')?.parentElement?.className

      const input = row0.querySelector('input')!
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
      await nextTick()
      expect(headerText()?.className).not.toContain('is-error')
      expect(findHeader(host, '姓名')?.querySelector('.u-table-editor__header-icon')).toBeFalsy()
      expect(nameCellError()).not.toContain('is-error')

      input.dispatchEvent(new Event('change', { bubbles: true }))
      await nextTick()
      await nextTick()
      expect(headerText()?.className).toContain('is-error')
      expect(findHeader(host, '姓名')?.querySelector('.u-table-editor__header-icon')).toBeTruthy()
      expect(nameCellError()).toContain('is-error')

      input.value = 'Alice'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
      await nextTick()
      await nextTick()
      expect(headerText()?.className).not.toContain('is-error')
      expect(nameCellError()).not.toContain('is-error')
    } finally {
      unmount()
    }
  })

  it('validate 全量校验：某行存在错误仍继续校验其后的行', async () => {
    const { host, getEditor, unmount } = mountTableEditor(
      {},
      [
        { name: 'Alice', age: 18, city: '杭州' },
        { name: '', age: 20, city: '上海' },
        { name: '', age: 22, city: '北京' }
      ],
      ruleColumns
    )

    try {
      await nextTick()
      await expect(getEditor().validate()).resolves.toBe(false)
      await nextTick()

      const nameHeader = findHeader(host, '姓名')!
      expect(nameHeader.querySelector('.u-table-editor__header-text')?.className).toContain(
        'is-error'
      )
      const icon = nameHeader.querySelector('.u-table-editor__header-icon')!
      expect(icon).toBeTruthy()
      expect(host.querySelectorAll('td .is-error')).toHaveLength(2)

      icon.dispatchEvent(new MouseEvent('mouseenter'))
      await nextTick()
      const bubble = document.querySelector('.u-tip__content')
      expect(bubble?.textContent).toContain('第 2 行')
      expect(bubble?.textContent).toContain('第 3 行')
      // 等弹层异步定位计算完成，避免与卸载竞争产生未处理拒绝
      await new Promise((resolve) => setTimeout(resolve))
    } finally {
      unmount()
    }
  })

  it('rules 含 required 的列表头渲染红星，其余列不渲染', async () => {
    const { host, unmount } = mountTableEditor({}, rows, ruleColumns)

    try {
      await nextTick()
      expect(host.querySelectorAll('.u-table-editor__required-mark')).toHaveLength(1)

      const mark = findHeader(host, '姓名')?.querySelector('.u-table-editor__required-mark')
      expect(mark).toBeTruthy()
      // 断言可见星号字形，而非仅节点存在
      expect(mark?.textContent).toBe('*')
    } finally {
      unmount()
    }
  })

  it('required 列自定义 `#header:key` 插槽时内容跟在星号后', async () => {
    const { host, unmount } = mountTableEditor(
      { 'header:name': () => h('em', { 'data-test': 'custom-header' }, '自定义姓名') },
      rows,
      ruleColumns
    )

    try {
      await nextTick()
      const header = findHeader(host, '自定义姓名')!
      expect(header.querySelector('.u-table-editor__required-mark')).toBeTruthy()
      expect(header.querySelector('[data-test="custom-header"]')).toBeTruthy()
    } finally {
      unmount()
    }
  })

  it('列存在未通过项时表头文字标红并出现感叹号图标，修正后恢复', async () => {
    const { host, getEditor, setModel, unmount } = mountTableEditor(
      {},
      [
        { name: 'Alice', age: 18, city: '杭州' },
        { name: '', age: 20, city: '上海' }
      ],
      ruleColumns
    )

    try {
      await nextTick()
      const nameHeader = findHeader(host, '姓名')!
      const headerText = () => nameHeader?.querySelector('.u-table-editor__header-text')

      expect(headerText()?.className).not.toContain('is-error')
      expect(nameHeader?.querySelector('.u-table-editor__header-icon')).toBeFalsy()

      await expect(getEditor().validate()).resolves.toBe(false)
      await nextTick()

      expect(headerText()?.className).toContain('is-error')
      expect(nameHeader?.querySelector('.u-table-editor__header-icon')).toBeTruthy()

      setModel([
        { name: 'Alice', age: 18, city: '杭州' },
        { name: 'Bob', age: 20, city: '上海' }
      ])
      await expect(getEditor().validate()).resolves.toBe(true)
      await nextTick()
      expect(headerText()?.className).not.toContain('is-error')
      expect(nameHeader?.querySelector('.u-table-editor__header-icon')).toBeFalsy()
    } finally {
      unmount()
    }
  })

  it('validate() 全表校验：全部通过 true，存在失败 false 并同步错误展示', async () => {
    // 用独立副本，避免与其它用例共享可变行数据
    const { host, getEditor, setModel, unmount } = mountTableEditor(
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
      const headerText = () =>
        findHeader(host, '姓名')?.querySelector('.u-table-editor__header-text')
      expect(headerText()?.className).toContain('is-error')
      expect(host.querySelector('td .is-error')).toBeTruthy()

      setModel([{ name: 'Alice', age: 18, city: '杭州' }])
      await nextTick()
      await expect(getEditor().validate()).resolves.toBe(true)
      await nextTick()
      expect(host.querySelector('td .is-error')).toBeFalsy()
    } finally {
      unmount()
    }
  })

  it('删除行后同步清理对应行的错误信息', async () => {
    const { host, getEditor, getDataRows, unmount } = mountTableEditor(
      {},
      [
        { name: '', age: 18, city: '杭州' },
        { name: 'Bob', age: 20, city: '上海' }
      ],
      ruleColumns
    )

    try {
      await nextTick()
      const headerText = () =>
        findHeader(host, '姓名')?.querySelector('.u-table-editor__header-text')

      await expect(getEditor().validate()).resolves.toBe(false)
      await nextTick()
      expect(headerText()?.className).toContain('is-error')

      click(getDataRows()[1].querySelector('[title="移除"]')!)
      await nextTick()
      expect(headerText()?.className).toContain('is-error')

      click(getDataRows()[0].querySelector('[title="移除"]')!)
      await nextTick()
      expect(headerText()?.className).not.toContain('is-error')
    } finally {
      unmount()
    }
  })
})
