import { describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive, ref } from 'vue'

import { UInput } from '../../input'
import { USelect } from '../../select'
import { defineTableColumns } from '../../table'
import { UBatchEdit } from '../index'

interface MountOptions {
  props?: Record<string, any>
  /** 给「名称」输入框附加校验规则 */
  labelRules?: Record<string, any>
}

function mountBatchEdit(options: MountOptions = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const columns = defineTableColumns([
    { key: 'label', name: '名称' },
    { key: 'behavior', name: '行为' }
  ])

  const initialData = [
    { id: '1', label: '存草稿', behavior: 'common-resource', submitType: 'DRAFT' },
    { id: '2', label: '调接口', behavior: 'api', submitType: 'SUBMIT', apiMethod: 'POST' }
  ]

  const data = ref(initialData.map((item) => ({ ...item })))

  const model = reactive({
    id: '',
    label: '',
    behavior: 'event',
    submitType: undefined as string | undefined,
    apiMethod: undefined as string | undefined
  })

  const app = createApp({
    render() {
      return h(
        UBatchEdit,
        {
          data: data.value,
          'onUpdate:data': (value: any[]) => {
            data.value = value
          },
          columns,
          model,
          rowKey: 'id',
          quickEdit: true,
          ...options.props
        },
        {
          form: () => [
            h(UInput, { field: 'label', label: '名称', rules: options.labelRules }),
            h(USelect, {
              field: 'behavior',
              label: '行为',
              options: [
                { label: '事件', value: 'event' },
                { label: '通用资源', value: 'common-resource' },
                { label: '接口', value: 'api' }
              ]
            }),
            model.behavior === 'api' || model.behavior === 'common-resource'
              ? h(USelect, {
                  field: 'submitType',
                  label: '提交类型',
                  options: [
                    { label: 'DRAFT', value: 'DRAFT' },
                    { label: 'SUBMIT', value: 'SUBMIT' },
                    { label: 'SAVE', value: 'SAVE' }
                  ]
                })
              : null,
            model.behavior === 'api'
              ? h(USelect, {
                  field: 'apiMethod',
                  label: 'HTTP 方法',
                  options: [
                    { label: 'POST', value: 'POST' },
                    { label: 'PUT', value: 'PUT' }
                  ]
                })
              : null
          ]
        }
      )
    }
  })

  app.mount(host)

  return {
    host,
    data,
    model,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

function queryRows(host: HTMLElement) {
  return [...host.querySelectorAll<HTMLElement>('tr.u-table__row')]
}

function queryEditButton(host: HTMLElement, index: number) {
  return queryRows(host)[index]?.querySelector<HTMLElement>('button[title="编辑"]')
}

async function clickRow(host: HTMLElement, index: number) {
  const row = queryRows(host)[index]
  expect(row, `第 ${index} 行应存在`).toBeTruthy()
  row!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await nextTick()
  await nextTick()
}

async function clickEditRow(host: HTMLElement, index: number) {
  const btn = queryEditButton(host, index)
  expect(btn, `第 ${index} 行的编辑按钮应存在`).toBeTruthy()
  btn!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await nextTick()
  await nextTick()
}

describe('UBatchEdit quick-edit 切换编辑行', () => {
  it('切换行时先重置表单再回显，不污染行数据', async () => {
    const { host, data, model, unmount } = mountBatchEdit()

    // 第一次点击第 1 行的编辑按钮：正常回显
    await clickEditRow(host, 0)
    expect(model.label).toBe('存草稿')
    expect(model.behavior).toBe('common-resource')
    expect(model.submitType).toBe('DRAFT')
    expect(model.apiMethod).toBeUndefined()

    // 再点击第 2 行的编辑按钮：先重置回 model 初始快照，再回显第 2 行数据
    await clickEditRow(host, 1)
    expect(model.label).toBe('调接口')
    expect(model.behavior).toBe('api')
    expect(model.submitType).toBe('SUBMIT')
    expect(model.apiMethod).toBe('POST')

    // 源数据不被默认值污染
    expect(data.value).toEqual([
      { id: '1', label: '存草稿', behavior: 'common-resource', submitType: 'DRAFT' },
      { id: '2', label: '调接口', behavior: 'api', submitType: 'SUBMIT', apiMethod: 'POST' }
    ])

    unmount()
  })

  it('点击行打开表单，再次点击当前行关闭表单', async () => {
    const { host, model, unmount } = mountBatchEdit()

    const aside = host.querySelector<HTMLElement>('.u-batch-edit__form')!

    await clickRow(host, 0)
    expect(aside.style.display).not.toBe('none')
    expect(model.label).toBe('存草稿')

    // 再次点击当前行：取消选中并关闭表单，model 恢复初始值
    await clickRow(host, 0)
    expect(aside.style.display).toBe('none')
    expect(model.label).toBe('')

    unmount()
  })

  it('关闭表单后表单数据重置为 model 初始值', async () => {
    const { host, data, model, unmount } = mountBatchEdit()

    await clickEditRow(host, 1)
    expect(model.label).toBe('调接口')

    // 点击「取消」关闭表单，model 恢复到初始快照
    clickEl(queryCancelButton(host)!)
    await nextTick()
    await nextTick()
    expect(model.label).toBe('')
    expect(model.behavior).toBe('event')
    expect(model.submitType).toBeUndefined()
    expect(model.apiMethod).toBeUndefined()

    expect(data.value[1]).toEqual({
      id: '2',
      label: '调接口',
      behavior: 'api',
      submitType: 'SUBMIT',
      apiMethod: 'POST'
    })

    unmount()
  })

  it('表单常驻挂载（v-show 控制显隐），切换行不重建表单', async () => {
    const { host, unmount } = mountBatchEdit()

    // model 存在即挂载表单，未编辑行时仅隐藏（快照只在首次挂载时拍一次）
    const aside = host.querySelector<HTMLElement>('.u-batch-edit__form')
    expect(aside).toBeTruthy()
    expect(aside!.style.display).toBe('none')

    await clickEditRow(host, 0)
    const formBody = host.querySelector('.u-batch-edit__form-body')
    expect(aside!.style.display).not.toBe('none')

    await clickEditRow(host, 1)
    // 同一 DOM 节点：表单未因切行销毁重建，初始快照不会被重新生成
    expect(host.querySelector('.u-batch-edit__form-body')).toBe(formBody)

    unmount()
  })

  it('quick-edit 下用户输入仍实时写回行数据', async () => {
    const { host, data, unmount } = mountBatchEdit()

    await clickEditRow(host, 0)

    const input = host.querySelector<HTMLInputElement>('.u-input input')
    expect(input).toBeTruthy()
    input!.value = '改过的名称'
    input!.dispatchEvent(
      new InputEvent('input', { bubbles: true, data: '改过的名称', inputType: 'insertText' })
    )
    await nextTick()
    await nextTick()

    expect(data.value[0]!.label).toBe('改过的名称')

    unmount()
  })
})

describe('UBatchEdit 操作列', () => {
  it('按钮顺序：编辑在最前，上/下插入在最后', async () => {
    const { host, unmount } = mountBatchEdit({ props: { tree: true } })
    await nextTick()

    const titles = [...queryRows(host)[0]!.querySelectorAll<HTMLElement>('button[title]')].map(
      (btn) => btn.title
    )
    expect(titles).toEqual(['编辑', '添加子级', '删除', '在上方插入', '在下方插入'])

    unmount()
  })

  it('readonly 模式操作列只保留「查看」按钮，点击打开只读表单', async () => {
    const { host, unmount } = mountBatchEdit({ props: { readonly: true } })
    await nextTick()

    const row = queryRows(host)[0]!
    const viewBtn = row.querySelector<HTMLElement>('button[title="查看"]')
    expect(viewBtn).toBeTruthy()
    expect(row.querySelector('button[title="删除"]')).toBeNull()
    expect(row.querySelector('button[title="在上方插入"]')).toBeNull()
    expect(host.querySelector('.u-batch-edit__add-btn')).toBeNull()

    viewBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await nextTick()
    await nextTick()

    expect(host.querySelector('.u-batch-edit__form-title-text')!.textContent).toBe('查看详情')

    unmount()
  })
})

function queryDialog() {
  return document.body.querySelector<HTMLElement>('.u-batch-edit__form-dialog')
}

/** 等弹框（teleport 到 body）打开：进入过渡在 CI 高负载下可能超过固定时长，轮询等待 */
async function waitDialogOpen() {
  await vi.waitFor(() => {
    expect(queryDialog()).toBeTruthy()
  })
}

/** 等弹框关闭卸载：离开过渡在 CI 高负载下可能超过固定时长，轮询等待 */
async function waitDialogClosed() {
  await vi.waitFor(() => {
    expect(queryDialog()).toBeNull()
  })
}

/** 等一次校验 / 保存等异步处理落地（固定短等，避免两次点击的 handleSave 重叠） */
async function waitDialogSettled() {
  await nextTick()
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 20))
  await nextTick()
}

/** 当前用例弹框的遮罩（body 上可能残留前序用例未卸载的弹框，必须按当前弹框定位） */
function currentOverlay() {
  return queryDialog()!.closest<HTMLElement>('.u-dialog__overlay')!
}

function clickEl(el: HTMLElement) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

function setInputValue(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(
    new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' })
  )
}

function querySaveButton(dialog: HTMLElement) {
  return dialog.querySelector<HTMLElement>('.u-batch-edit__form-actions button[title="保存"]')
}

function queryCancelButton(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>('.u-batch-edit__form-actions button')].find(
    (btn) => btn.textContent?.includes('取消')
  )
}

describe('UBatchEdit formMode', () => {
  it('默认（不传 formMode）仍渲染右侧面板，不出现弹框', async () => {
    const { host, unmount } = mountBatchEdit()

    await clickEditRow(host, 0)
    const aside = host.querySelector<HTMLElement>('.u-batch-edit__form')
    expect(aside).toBeTruthy()
    expect(aside!.style.display).not.toBe('none')
    expect(queryDialog()).toBeNull()

    unmount()
  })

  it('formMode="dialog" 时不渲染右列，触发编辑后以弹框打开表单', async () => {
    const { host, model, unmount } = mountBatchEdit({
      props: { formMode: 'dialog', quickEdit: false }
    })

    expect(host.querySelector('.u-batch-edit__form')).toBeNull()
    expect(queryDialog()).toBeNull()

    await clickEditRow(host, 0)
    await waitDialogOpen()

    const dialog = queryDialog()
    expect(dialog).toBeTruthy()
    // 表格占满整行，右列不再渲染
    expect(host.querySelector('.u-batch-edit__form')).toBeNull()
    // 弹框内复用原表单头部 / 表单体 / 底部操作区
    expect(dialog!.querySelector('.u-batch-edit__form-header')).toBeTruthy()
    expect(dialog!.querySelector('.u-batch-edit__form-body')).toBeTruthy()
    expect(dialog!.querySelector('.u-batch-edit__form-actions')).toBeTruthy()
    // 编辑行已回显
    expect(model.label).toBe('存草稿')

    unmount()
  })

  it('弹框内保存走校验与 saveMethod，成功后关闭弹框', async () => {
    const saveMethod = vi.fn()
    const { host, data, unmount } = mountBatchEdit({
      props: { formMode: 'dialog', quickEdit: false, saveMethod },
      labelRules: { required: true }
    })

    // 打开新增弹框
    clickEl(host.querySelector<HTMLElement>('.u-batch-edit__add-btn')!)
    await waitDialogOpen()

    // 必填校验失败：不调用 saveMethod，弹框保持打开
    clickEl(querySaveButton(queryDialog()!)!)
    await waitDialogSettled()
    expect(saveMethod).not.toHaveBeenCalled()
    expect(queryDialog()).toBeTruthy()

    // 填写后保存：走 saveMethod 并插入数据，成功后关闭弹框
    setInputValue(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!, '新名称')
    await nextTick()
    await nextTick()
    clickEl(querySaveButton(queryDialog()!)!)
    await waitDialogClosed()

    expect(saveMethod).toHaveBeenCalledTimes(1)
    expect(saveMethod.mock.calls[0]![0]).toMatchObject({ label: '新名称' })
    expect(saveMethod.mock.calls[0]![1]).toBe('create')
    expect(data.value).toHaveLength(3)
    expect(data.value[2]).toMatchObject({ label: '新名称' })

    unmount()
  })

  it('弹框新增「保存并继续」：插入后弹框保持打开、表单重置，可连续录入', async () => {
    const saveMethod = vi.fn()
    const { host, data, model, unmount } = mountBatchEdit({
      props: { formMode: 'dialog', quickEdit: false, saveMethod }
    })

    clickEl(host.querySelector<HTMLElement>('.u-batch-edit__add-btn')!)
    await waitDialogOpen()

    const continueBtn = () =>
      queryDialog()!.querySelector<HTMLElement>(
        '.u-batch-edit__form-actions button[title="保存并继续"]'
      )!

    // 编辑已有行走 update，不显示「保存并继续」由面板用例覆盖；新增弹框内应存在
    expect(continueBtn()).toBeTruthy()

    setInputValue(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!, '第一条')
    await nextTick()
    await nextTick()
    clickEl(continueBtn())
    await waitDialogSettled()

    // 插入一行但弹框保持打开，表单重置为初始值
    expect(data.value).toHaveLength(3)
    expect(data.value[2]).toMatchObject({ label: '第一条' })
    expect(queryDialog()).toBeTruthy()
    expect(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!.value).toBe('')
    expect(model.label).toBe('')

    // 继续录入第二条后普通保存：追加到末尾并关闭弹框
    setInputValue(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!, '第二条')
    await nextTick()
    await nextTick()
    clickEl(querySaveButton(queryDialog()!)!)
    await waitDialogClosed()

    expect(saveMethod).toHaveBeenCalledTimes(2)
    expect(data.value).toHaveLength(4)
    expect(data.value[3]).toMatchObject({ label: '第二条' })

    unmount()
  })

  it('弹框模式不响应 Ctrl/Cmd + S：不保存、弹框保持打开，快捷键提示不再出现', async () => {
    const saveMethod = vi.fn()
    const { host, data, unmount } = mountBatchEdit({
      props: { formMode: 'dialog', quickEdit: false, saveMethod }
    })

    clickEl(host.querySelector<HTMLElement>('.u-batch-edit__add-btn')!)
    await waitDialogOpen()

    setInputValue(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!, '新名称')
    await nextTick()
    await nextTick()

    queryDialog()!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 's',
        code: 'KeyS',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      })
    )
    await waitDialogSettled()

    expect(saveMethod).not.toHaveBeenCalled()
    expect(data.value).toHaveLength(2)
    expect(queryDialog()).toBeTruthy()
    expect(queryDialog()!.querySelector('.u-batch-edit__form-hint')!.textContent).not.toContain(
      'Ctrl + S'
    )

    // Esc 仍可关闭弹框
    queryDialog()!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    )
    await waitDialogClosed()
    expect(saveMethod).not.toHaveBeenCalled()

    unmount()
  })

  it('面板模式 Ctrl/Cmd + S 保存仍可用（组件获焦时生效）', async () => {
    const saveMethod = vi.fn()
    const { host, unmount } = mountBatchEdit({ props: { quickEdit: false, saveMethod } })

    await clickEditRow(host, 0)

    const input = host.querySelector<HTMLInputElement>('.u-batch-edit__form .u-input input')!
    // 面板模式快捷键要求组件获焦：focusin 冒泡到根布局后置位
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 's',
        code: 'KeyS',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      })
    )
    await waitDialogSettled()

    expect(saveMethod).toHaveBeenCalledTimes(1)
    expect(saveMethod.mock.calls[0]![1]).toBe('update')

    unmount()
  })

  it('弹框内取消 / 关闭按钮 / 遮罩点击均不保存，且 model 恢复初始值', async () => {
    const saveMethod = vi.fn()
    const { host, data, model, unmount } = mountBatchEdit({
      props: { formMode: 'dialog', quickEdit: false, saveMethod }
    })

    // 编辑第 1 行后取消
    await clickEditRow(host, 0)
    await waitDialogOpen()
    setInputValue(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!, '改过的名称')
    await nextTick()
    await nextTick()
    clickEl(queryCancelButton(queryDialog()!)!)
    await waitDialogClosed()

    expect(saveMethod).not.toHaveBeenCalled()
    expect(data.value[0]).toMatchObject({ label: '存草稿' })
    // model 恢复初始快照，而不是残留上一行数据
    expect(model.label).toBe('')
    expect(model.submitType).toBeUndefined()

    // 取消后再新增：表单应为初始值（快照不被上一行污染）
    clickEl(host.querySelector<HTMLElement>('.u-batch-edit__add-btn')!)
    await waitDialogOpen()
    expect(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!.value).toBe('')

    // 表单头部的关闭按钮同样不保存
    setInputValue(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!, '随便写')
    await nextTick()
    await nextTick()
    clickEl(queryDialog()!.querySelector<HTMLElement>('.u-batch-edit__form-close')!)
    await waitDialogClosed()
    expect(saveMethod).not.toHaveBeenCalled()
    expect(model.label).toBe('')
    expect(data.value).toHaveLength(2)

    // 弹框自身关闭交互（点击遮罩）也不保存
    await clickEditRow(host, 1)
    await waitDialogOpen()
    setInputValue(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!, '改过的名称')
    await nextTick()
    await nextTick()
    currentOverlay().dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
    await waitDialogClosed()

    expect(saveMethod).not.toHaveBeenCalled()
    expect(data.value[1]).toMatchObject({ label: '调接口' })
    expect(model.label).toBe('')

    unmount()
  })
})

describe('UBatchEdit 重入保护', () => {
  it('保存进行中重复触发（快捷键/连点）被忽略：saveMethod 只调一次、只插一行、弹框正常关闭', async () => {
    const saveMethod = vi.fn()
    const { host, data, unmount } = mountBatchEdit({
      props: { formMode: 'dialog', quickEdit: false, saveMethod },
      labelRules: { required: true }
    })

    clickEl(host.querySelector<HTMLElement>('.u-batch-edit__add-btn')!)
    await waitDialogOpen()

    setInputValue(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!, '新名称')
    await nextTick()
    await nextTick()

    // 同一 tick 内连续两次点击保存（模拟保存进行中的重复触发），中间故意不等待
    const saveBtn = querySaveButton(queryDialog()!)!
    clickEl(saveBtn)
    clickEl(saveBtn)

    await waitDialogClosed()

    expect(saveMethod).toHaveBeenCalledTimes(1)
    expect(data.value).toHaveLength(3)
    expect(data.value[2]).toMatchObject({ label: '新名称' })

    unmount()
  })

  it('删除进行中重复触发被忽略：deleteMethod 只调一次、只删一行', async () => {
    const deleteMethod = vi.fn()
    const { host, data, unmount } = mountBatchEdit({ props: { deleteMethod } })
    await nextTick()

    // 同一 tick 内连续两次点击删除，中间故意不等待
    const deleteBtn = queryRows(host)[0]!.querySelector<HTMLElement>('button[title="删除"]')!
    clickEl(deleteBtn)
    clickEl(deleteBtn)

    await waitDialogSettled()

    expect(deleteMethod).toHaveBeenCalledTimes(1)
    expect(deleteMethod.mock.calls[0]![0]).toHaveLength(1)
    expect(data.value).toHaveLength(1)
    expect(data.value[0]).toMatchObject({ id: '2' })

    unmount()
  })
})

describe('UBatchEdit 属性透传', () => {
  it('style / class 等非 props 属性透传到根布局元素（组件为片段根，需手动继承）', async () => {
    const { host, unmount } = mountBatchEdit({
      props: { style: 'height: 500px', class: 'custom-batch-edit' }
    })
    await nextTick()

    const root = host.querySelector<HTMLElement>('.u-batch-edit')
    expect(root).toBeTruthy()
    expect(root!.classList.contains('custom-batch-edit')).toBe(true)
    expect(root!.style.height).toBe('500px')

    unmount()
  })
})
