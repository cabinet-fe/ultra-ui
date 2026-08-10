import { Workbook } from '@veltra/sheet-core'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'

import { UReportDesigner } from '../../../index'
import { REPORT_META_NAMESPACE } from '../../../report/binding'
import type { DataConnection, DataConnector } from '../../../report/connector'
import type { ParamValues, ReportBinding } from '../../../report/types'
import type { ReportDesignerExposed } from '../../../types'
import { FIELD_DRAG_MIME } from '../field-panel-helpers'

// ---- 内联 fixtures：stub connector（实现 DataConnector 接口的内存测试夹具）----

function createStubConnector() {
  const calls = {
    test: [] as DataConnection[],
    describe: [] as Array<{ connection: DataConnection; sql: string }>,
    query: [] as Array<{ connection: DataConnection; sql: string; values: ParamValues }>
  }
  /** test 结果可变（失败路径用例切换为业务错误） */
  const state = {
    testOutcome: { ok: true, data: undefined } as Awaited<ReturnType<DataConnector['test']>>
  }
  const connector: DataConnector = {
    test: (connection) => {
      calls.test.push(connection)
      return Promise.resolve(state.testOutcome)
    },
    describe: (connection, sql) => {
      calls.describe.push({ connection, sql })
      return Promise.resolve({ ok: true, data: [] })
    },
    query: (connection, sql, values) => {
      calls.query.push({ connection, sql, values })
      return Promise.resolve({ ok: true, data: { fields: [], rows: [] } })
    }
  }
  return { connector, calls, state }
}

// ---- 挂载与等待 ----

const apps: App[] = []
const containers: HTMLElement[] = []

function mountDesigner(workbook: Workbook) {
  const { connector, calls, state } = createStubConnector()
  const el = document.createElement('div')
  el.style.width = '960px'
  el.style.height = '600px'
  document.body.appendChild(el)
  containers.push(el)
  const connections = ref<DataConnection[]>([])
  const exposedRef = { value: undefined as ReportDesignerExposed | undefined }
  const app = createApp({
    render: () =>
      h(UReportDesigner, {
        connector,
        workbook,
        connections: connections.value,
        'onUpdate:connections': (value: DataConnection[]) => {
          connections.value = value
        },
        ref: (value: unknown) => {
          exposedRef.value = value as ReportDesignerExposed | undefined
        }
      })
  })
  app.mount(el)
  apps.push(app)
  return { app, el, connections, exposedRef, calls, state }
}

/** 等待抽屉（teleport + transition）与连接器微任务落定 */
async function flush(): Promise<void> {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
  await nextTick()
}

/** 按文本定位按钮（drawer 经 Teleport 挂到 body，统一在 document 范围找） */
function findButton(text: string): HTMLButtonElement | undefined {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
    button.textContent?.includes(text)
  )
}

async function click(button: HTMLElement): Promise<void> {
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await flush()
}

/** 构造字段拖拽 drop 事件（happy-dom 无 DataTransfer 构造器，注入最小桩） */
function dispatchFieldDrop(target: HTMLElement, payload: string): void {
  const event = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      types: [FIELD_DRAG_MIME],
      getData: (type: string) => (type === FIELD_DRAG_MIME ? payload : '')
    }
  })
  // 落点超出网格视口 → hit-test 落空，回退当前选区（确定性断言）
  Object.defineProperty(event, 'clientX', { value: 99999 })
  Object.defineProperty(event, 'clientY', { value: 99999 })
  target.dispatchEvent(event)
}

afterEach(() => {
  while (apps.length) apps.pop()!.unmount()
  while (containers.length) containers.pop()!.remove()
  // drawer Teleport 到 body，卸载后清理残留
  document.querySelectorAll('.u-drawer-overlay').forEach((node) => node.remove())
})

describe('UReportDesigner 最小闭环（数据中枢 + 拖拽绑定 + getTemplate）', () => {
  it('连接 CRUD / 真实测试连接走 v-model:connections 与连接器；落格写 meta；getTemplate 吐出快照', async () => {
    const workbook = new Workbook()
    const { el, connections, exposedRef, calls } = mountDesigner(workbook)
    await flush()

    // 打开数据中枢 drawer（Teleport 到 body）
    const hubTrigger = el.querySelector<HTMLButtonElement>('.u-report-designer__toolbar button')!
    expect(hubTrigger.textContent).toContain('数据中枢')
    await click(hubTrigger)
    expect(document.querySelector('.u-report-hub')).toBeTruthy()

    // 新建连接：表单出现 → 真实测试连接（经 stub connector）→ 保存
    await click(findButton('新建连接')!)
    expect(document.querySelector('.u-report-hub-connection-form')).toBeTruthy()

    await click(findButton('测试连接')!)
    expect(calls.test).toHaveLength(1)
    expect(calls.test[0]).toMatchObject({ label: '新连接', type: 'mysql' })
    expect(document.querySelector('.u-report-hub-connection-form__test')?.textContent).toContain(
      '连接成功'
    )

    await click(findButton('保存')!)
    expect(connections.value).toHaveLength(1)
    expect(connections.value[0]).toMatchObject({ label: '新连接', type: 'mysql' })
    const connectionId = connections.value[0]!.id

    // 在该连接下新建数据集（编辑器出现，含 SQL 编辑与 schema/preview tabs）
    await click(findButton('+ 新建数据集')!)
    expect(document.querySelector('.u-report-hub-dataset-editor')).toBeTruthy()
    const datasetId = document.querySelector('.u-report-hub__dataset-id')!.textContent!

    // 关闭 drawer，回到设计态
    await click(findButton('完成')!)

    // 拖拽字段落格 → 写入 Cell Meta 绑定（落点 hit-test 落空 → 回退当前选区 A1）
    const gridHost = el.querySelector<HTMLElement>('.u-report-designer__grid')!
    dispatchFieldDrop(gridHost, `${datasetId}:customer`)
    await flush()

    const metas = [...workbook.activeSheet.entriesCellMeta()].filter(
      ([, namespace]) => namespace === REPORT_META_NAMESPACE
    )
    expect(metas).toHaveLength(1)
    const [addr, , payload] = metas[0]!
    expect(addr).toEqual({ row: 0, col: 0 })
    expect(payload as ReportBinding).toMatchObject({
      dataset: datasetId,
      field: 'customer',
      role: 'detail',
      aggregate: 'select',
      expand: 'down',
      leftParent: 'default'
    })

    // getTemplate() 返回含 meta 绑定与内嵌数据集定义（连接对象内嵌，凭据随模板流转）
    const template = exposedRef.value!.getTemplate()
    expect(template.meta).toHaveLength(1)
    expect(template.meta![0]).toMatchObject({ row: 0, col: 0, namespace: 'report' })
    expect(template.datasets).toEqual([
      {
        id: datasetId,
        label: '新数据集',
        connection: { ...connections.value[0]!, id: connectionId },
        sql: ''
      }
    ])
  })

  it('测试连接业务失败（ok:false）时展示可读错误提示', async () => {
    const workbook = new Workbook()
    const { el, state } = mountDesigner(workbook)
    state.testOutcome = {
      ok: false,
      error: { code: 'CONNECTION_FAILED', message: '数据库连接失败' }
    }
    await flush()

    await click(el.querySelector<HTMLButtonElement>('.u-report-designer__toolbar button')!)
    await click(findButton('新建连接')!)
    await click(findButton('测试连接')!)

    const banner = document.querySelector('.u-report-hub-connection-form__test')
    expect(banner?.textContent).toContain('数据库连接失败')
    expect(banner?.classList.contains('is-ok')).toBe(false)
  })
})
