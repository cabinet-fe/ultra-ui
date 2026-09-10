import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, reactive, ref } from 'vue'

import { UInput } from '../../input'
import { USelect } from '../../select'
import { defineTableColumns } from '../../table'
import { UBatchEdit } from '../index'

function mountBatchEdit() {
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
          quickEdit: true
        },
        {
          form: () => [
            h(UInput, { field: 'label', label: '名称' }),
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
