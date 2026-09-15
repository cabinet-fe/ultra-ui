import { describe, expect, it } from 'vitest'
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

const mouseover = (el: Element) => el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
const focusin = (el: Element) => el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
const focusout = (el: Element) => el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
const keydown = (el: Element, key: string, shiftKey = false) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }))

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
    getRoot: () => host.querySelector<HTMLElement>('.u-table-editor')!,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UTableEditor 单元格常驻渲染', () => {
  it('初始渲染即挂载编辑控件，未声明插槽的列渲染字段原始值', async () => {
    const { host, getDataRows, unmount } = mountTableEditor({
      'column:name': renderNameInput,
      'column:age': renderAgeInput
    })

    try {
      await nextTick()
      // 每个数据行的编辑控件初始即挂载
      expect(host.querySelectorAll('[data-test="name-input"]')).toHaveLength(2)
      expect(host.querySelectorAll('[data-test="age-input"]')).toHaveLength(2)

      const [row0] = getDataRows()
      // 未声明 #column:key 的列渲染字段原始值
      expect(row0.textContent).toContain('杭州')
    } finally {
      unmount()
    }
  })

  it('悬停移入/移出行不切换渲染，编辑控件保持挂载', async () => {
    const { getRoot, getDataRows, unmount } = mountTableEditor({ 'column:name': renderNameInput })

    try {
      await nextTick()
      const [row0] = getDataRows()

      mouseover(row0)
      await nextTick()
      expect(row0.querySelector('[data-test="name-input"]')).toBeTruthy()

      getRoot().dispatchEvent(new MouseEvent('mouseleave'))
      await nextTick()
      expect(row0.querySelector('[data-test="name-input"]')).toBeTruthy()
    } finally {
      unmount()
    }
  })

  it('行内聚焦/失焦不切换渲染，编辑控件保持挂载', async () => {
    const { getDataRows, unmount } = mountTableEditor({ 'column:name': renderNameInput })

    try {
      await nextTick()
      const [row0] = getDataRows()

      const input = row0.querySelector('input')!
      focusin(input)
      await nextTick()
      expect(row0.querySelector('[data-test="name-input"]')).toBeTruthy()

      focusout(input)
      await nextTick()
      expect(row0.querySelector('[data-test="name-input"]')).toBeTruthy()
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

/** 按列名查找表头单元格 */
const findHeader = (host: Element, name: string) =>
  [...host.querySelectorAll('th')].find((th) => th.textContent?.includes(name))

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
      // readonly 经插槽 model 注入到输入控件
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
      // u-input 收到 readonly 后按只读展示态渲染值，不再是可编辑控件
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

  it('无操作列标记下键盘导航仍识别数据行', async () => {
    const { getDataRows, unmount } = mountTableEditor(
      { 'column:name': renderNameInput, 'column:age': renderAgeInput },
      rows,
      columns,
      { readonly: true }
    )

    try {
      await nextTick()
      const [row0] = getDataRows()

      keydown(row0.querySelector('[data-test="name-input"]')!, 'Tab')
      await nextTick()
      expect(document.activeElement).toBe(row0.querySelector('[data-test="age-input"]'))
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

      // 输入过程（input 事件）不触发校验：清空后表头无错误指示
      const input = row0.querySelector('input')!
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
      await nextTick()
      expect(headerText()?.className).not.toContain('is-error')
      expect(findHeader(host, '姓名')?.querySelector('.u-table-editor__header-icon')).toBeFalsy()

      // change 事件（如失焦提交）触发校验：该列表头出现错误指示，单元格自身无错误样式
      input.dispatchEvent(new Event('change', { bubbles: true }))
      await nextTick()
      await nextTick()
      expect(headerText()?.className).toContain('is-error')
      expect(findHeader(host, '姓名')?.querySelector('.u-table-editor__header-icon')).toBeTruthy()
      expect(row0.querySelector('.u-table-editor__cell-error')).toBeFalsy()

      // 填回合法值并 change，错误消失
      input.value = 'Alice'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
      await nextTick()
      await nextTick()
      expect(headerText()?.className).not.toContain('is-error')
    } finally {
      unmount()
    }
  })

  it('validate 懒校验：某行存在错误即停止校验其后的行', async () => {
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

      // 第 2 行 name 校验失败：该列表头标红并出现感叹号图标
      const nameHeader = findHeader(host, '姓名')!
      expect(nameHeader.querySelector('.u-table-editor__header-text')?.className).toContain(
        'is-error'
      )
      const icon = nameHeader.querySelector('.u-table-editor__header-icon')!
      expect(icon).toBeTruthy()

      // 悬停图标查看气泡：仅含第 2 行明细，第 3 行未校验不出现
      icon.dispatchEvent(new MouseEvent('mouseenter'))
      await nextTick()
      const bubble = document.querySelector('.u-tip__content')
      expect(bubble?.textContent).toContain('第 2 行')
      expect(bubble?.textContent).not.toContain('第 3 行')
      // 等弹层异步定位计算完成，避免与卸载竞争产生未处理拒绝
      await new Promise((resolve) => setTimeout(resolve))
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

      const nameHeader = findHeader(host, '姓名')
      const mark = nameHeader?.querySelector('.u-table-editor__required-mark')
      expect(mark).toBeTruthy()
      // 断言可见星号字形，而非仅节点存在
      expect(mark?.textContent).toBe('*')
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

      // 初始无错误：表头无错误态、无图标
      expect(headerText()?.className).not.toContain('is-error')
      expect(nameHeader?.querySelector('.u-table-editor__header-icon')).toBeFalsy()

      await expect(getEditor().validate()).resolves.toBe(false)
      await nextTick()

      // 该列存在未通过项：文字标红 + 感叹号图标（tip 触发器）出现
      expect(headerText()?.className).toContain('is-error')
      expect(nameHeader?.querySelector('.u-table-editor__header-icon')).toBeTruthy()

      // 修正后表头恢复
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
      // validate 后失败列的表头直接出现错误指示
      const headerText = () =>
        findHeader(host, '姓名')?.querySelector('.u-table-editor__header-text')
      expect(headerText()?.className).toContain('is-error')

      setModel([{ name: 'Alice', age: 18, city: '杭州' }])
      await nextTick()
      await expect(getEditor().validate()).resolves.toBe(true)
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

      // 删除无错误的行，其余行的错误保留
      click(getDataRows()[1].querySelector('[title="移除"]')!)
      await nextTick()
      expect(headerText()?.className).toContain('is-error')

      // 删除有错误的行，错误随之清理
      click(getDataRows()[0].querySelector('[title="移除"]')!)
      await nextTick()
      expect(headerText()?.className).not.toContain('is-error')
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
      // 新行单元格的编辑控件随行挂载并自动聚焦
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

      keydown(dataRows[1].querySelector('[data-test="name-input"]')!, 'Tab', true)
      await nextTick()
      await nextTick()
      const prevAge = dataRows[0].querySelector('[data-test="age-input"]')!
      expect(prevAge).toBeTruthy()
      expect(document.activeElement).toBe(prevAge)
    } finally {
      unmount()
    }
  })
})
