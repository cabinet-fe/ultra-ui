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

async function clickRow(host: HTMLElement, index: number) {
  const row = queryRows(host)[index]
  expect(row, `第 ${index} 行应存在`).toBeTruthy()
  row!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  await nextTick()
  await nextTick()
}

describe('UBatchEdit quick-edit 切换编辑行', () => {
  it('切换行时先重置表单再回显，不污染行数据', async () => {
    const { host, data, model, unmount } = mountBatchEdit()

    // 第一次点击第 1 行：正常回显
    await clickRow(host, 0)
    expect(model.label).toBe('存草稿')
    expect(model.behavior).toBe('common-resource')
    expect(model.submitType).toBe('DRAFT')
    expect(model.apiMethod).toBeUndefined()

    // 再点击第 2 行：先重置回 model 初始快照，再回显第 2 行数据
    await clickRow(host, 1)
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

  it('取消选中行后表单数据重置为 model 初始值', async () => {
    const { host, data, model, unmount } = mountBatchEdit()

    await clickRow(host, 1)
    expect(model.label).toBe('调接口')

    // 再次点击当前行 → 取消选中，表单恢复到 model 初始快照
    await clickRow(host, 1)
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

    // model 存在即挂载表单，未选中行时仅隐藏（快照只在首次挂载时拍一次）
    const aside = host.querySelector<HTMLElement>('.u-batch-edit__form')
    expect(aside).toBeTruthy()
    expect(aside!.style.display).toBe('none')

    await clickRow(host, 0)
    const formBody = host.querySelector('.u-batch-edit__form-body')
    expect(aside!.style.display).not.toBe('none')

    await clickRow(host, 1)
    // 同一 DOM 节点：表单未因切行销毁重建，初始快照不会被重新生成
    expect(host.querySelector('.u-batch-edit__form-body')).toBe(formBody)

    unmount()
  })

  it('quick-edit 下用户输入仍实时写回行数据', async () => {
    const { host, data, unmount } = mountBatchEdit()

    await clickRow(host, 0)

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

function queryDialog() {
  return document.body.querySelector<HTMLElement>('.u-batch-edit__form-dialog')
}

/** 等弹框（teleport 到 body）的进入 / 离开过渡走完 */
async function flushDialog() {
  await nextTick()
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 20))
  await nextTick()
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

function queryCancelButton(dialog: HTMLElement) {
  return [...dialog.querySelectorAll<HTMLElement>('.u-batch-edit__form-actions button')].find(
    (btn) => btn.textContent?.includes('取消')
  )
}

describe('UBatchEdit formMode', () => {
  it('默认（不传 formMode）仍渲染右侧面板，不出现弹框', async () => {
    const { host, unmount } = mountBatchEdit()

    await clickRow(host, 0)
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

    await clickRow(host, 0)
    await flushDialog()

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
    await flushDialog()
    expect(queryDialog()).toBeTruthy()

    // 必填校验失败：不调用 saveMethod，弹框保持打开
    clickEl(querySaveButton(queryDialog()!)!)
    await flushDialog()
    expect(saveMethod).not.toHaveBeenCalled()
    expect(queryDialog()).toBeTruthy()

    // 填写后保存：走 saveMethod 并插入数据，成功后关闭弹框
    setInputValue(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!, '新名称')
    await nextTick()
    await nextTick()
    clickEl(querySaveButton(queryDialog()!)!)
    await flushDialog()

    expect(saveMethod).toHaveBeenCalledTimes(1)
    expect(saveMethod.mock.calls[0]![0]).toMatchObject({ label: '新名称' })
    expect(saveMethod.mock.calls[0]![1]).toBe('create')
    expect(data.value).toHaveLength(3)
    expect(data.value[2]).toMatchObject({ label: '新名称' })
    expect(queryDialog()).toBeNull()

    unmount()
  })

  it('弹框内取消 / 关闭按钮 / 遮罩点击均不保存，且 model 恢复初始值', async () => {
    const saveMethod = vi.fn()
    const { host, data, model, unmount } = mountBatchEdit({
      props: { formMode: 'dialog', quickEdit: false, saveMethod }
    })

    // 编辑第 1 行后取消
    await clickRow(host, 0)
    await flushDialog()
    setInputValue(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!, '改过的名称')
    await nextTick()
    await nextTick()
    clickEl(queryCancelButton(queryDialog()!)!)
    await flushDialog()

    expect(saveMethod).not.toHaveBeenCalled()
    expect(data.value[0]).toMatchObject({ label: '存草稿' })
    // model 恢复初始快照，而不是残留上一行数据
    expect(model.label).toBe('')
    expect(model.submitType).toBeUndefined()
    expect(queryDialog()).toBeNull()

    // 取消后再新增：表单应为初始值（快照不被上一行污染）
    clickEl(host.querySelector<HTMLElement>('.u-batch-edit__add-btn')!)
    await flushDialog()
    expect(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!.value).toBe('')

    // 表单头部的关闭按钮同样不保存
    setInputValue(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!, '随便写')
    await nextTick()
    await nextTick()
    clickEl(queryDialog()!.querySelector<HTMLElement>('.u-batch-edit__form-close')!)
    await flushDialog()
    expect(saveMethod).not.toHaveBeenCalled()
    expect(model.label).toBe('')
    expect(data.value).toHaveLength(2)
    expect(queryDialog()).toBeNull()

    // 弹框自身关闭交互（点击遮罩）也不保存
    await clickRow(host, 1)
    await flushDialog()
    setInputValue(queryDialog()!.querySelector<HTMLInputElement>('.u-input input')!, '改过的名称')
    await nextTick()
    await nextTick()
    document
      .querySelector<HTMLElement>('.u-dialog__overlay')!
      .dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
    await flushDialog()

    expect(saveMethod).not.toHaveBeenCalled()
    expect(data.value[1]).toMatchObject({ label: '调接口' })
    expect(model.label).toBe('')
    expect(queryDialog()).toBeNull()

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
