import { Workbook } from '@veltra/sheet-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'

import { UReportDesigner } from '../../../index'
import { REPORT_META_NAMESPACE } from '../../../report/binding'
import type { DataConnection, DataConnector } from '../../../report/connector'
import type { ReportTemplate } from '../../../report/template'
import type { ParamValues, ReportBinding } from '../../../report/types'
import type { ReportDesignerExposed } from '../../../types'
import * as cellCoords from '../designer/cell-coords'
import * as gridOverlay from '../designer/use-grid-overlay'
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
      return Promise.resolve({
        ok: true,
        data: [
          { name: 'customer', label: '客户', type: 'string' as const },
          { name: 'amount', label: '金额', type: 'number' as const }
        ]
      })
    },
    query: (connection, sql, values) => {
      calls.query.push({ connection, sql, values })
      return Promise.resolve({
        ok: true,
        data: {
          fields: [
            { name: 'customer', label: '客户', type: 'string' as const },
            { name: 'amount', label: '金额', type: 'number' as const }
          ],
          rows: [
            { customer: '甲公司', amount: 100 },
            { customer: '乙公司', amount: 400 }
          ]
        }
      })
    }
  }
  return { connector, calls, state }
}

// ---- 挂载与等待 ----

const apps: App[] = []
const containers: HTMLElement[] = []

function mountDesigner(workbook: Workbook, options?: { template?: ReportTemplate }) {
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
        template: options?.template,
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

/** 构造字段拖拽 dragover 事件 */
function dispatchFieldDragOver(target: HTMLElement, clientX = 100, clientY = 100): void {
  const event = new Event('dragover', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', {
    value: { types: [FIELD_DRAG_MIME], dropEffect: 'copy' }
  })
  Object.defineProperty(event, 'clientX', { value: clientX })
  Object.defineProperty(event, 'clientY', { value: clientY })
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
      preset: 'detail',
      aggregate: 'list',
      expand: 'down'
    })

    // getTemplate() 返回含 meta 绑定与内嵌数据集定义（连接对象内嵌，凭据随模板流转）
    const template = exposedRef.value!.getTemplate()
    expect(template.version).toBe(1)
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

describe('UReportDesigner 全量：template 载入与预览模式（内嵌查看器路径）', () => {
  const TEMPLATE_CONNECTION: DataConnection = {
    id: 'conn-template',
    label: '模板连接',
    type: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    database: 'demo',
    username: 'root',
    password: ''
  }

  function buildTemplate(): ReportTemplate {
    const group: ReportBinding = {
      dataset: 'ds-template',
      field: 'customer',
      preset: 'groupHeader',
      aggregate: 'group',
      expand: 'down',
      sort: 'none',
      conditionalRules: []
    }
    return {
      version: 1,
      cells: [{ row: 0, col: 0, v: '客户' }],
      styles: [],
      merges: [],
      frozen: { rows: 0, cols: 0 },
      rows: 24,
      cols: 10,
      meta: [{ row: 1, col: 0, namespace: REPORT_META_NAMESPACE, payload: group }],
      datasets: [
        {
          id: 'ds-template',
          label: '订单',
          connection: TEMPLATE_CONNECTION,
          sql: 'SELECT customer, amount FROM orders'
        }
      ]
    }
  }

  function reportMetas(workbook: Workbook) {
    return [...workbook.activeSheet.entriesCellMeta()].filter(
      ([, namespace]) => namespace === REPORT_META_NAMESPACE
    )
  }

  it('template prop 载入恢复绑定与连接；预览切换经内嵌查看器取数展开；切回设计态绑定不丢', async () => {
    const workbook = new Workbook()
    const { el, connections, exposedRef, calls } = mountDesigner(workbook, {
      template: buildTemplate()
    })
    await flush()

    // 模板载入：绑定恢复 + 内嵌连接合并进 v-model 列表
    expect(reportMetas(workbook)).toHaveLength(1)
    expect(connections.value.map((item) => item.id)).toEqual(['conn-template'])

    // 切预览：内嵌查看器按模板内嵌数据集取数（含 Filter Bar 参数默认值）
    await click(findButton('预览模式')!)
    expect(el.querySelector('.u-report-viewer')).toBeTruthy()
    expect(calls.query).toHaveLength(1)
    expect(calls.query[0]!.connection.id).toBe('conn-template')
    expect(calls.query[0]!.sql).toBe('SELECT customer, amount FROM orders')
    // 取数成功：无业务错误 banner；设计格线已卸载
    expect(el.querySelector('.u-report-viewer__error')).toBeFalsy()
    expect(el.querySelector('.u-report-designer__grid')).toBeFalsy()

    // 切回设计态：绑定不丢，可继续设计
    await click(findButton('设计模式')!)
    expect(el.querySelector('.u-report-viewer')).toBeFalsy()
    expect(el.querySelector('.u-report-designer__grid')).toBeTruthy()
    expect(reportMetas(workbook)).toHaveLength(1)

    // getTemplate 往返：绑定与内嵌数据集定义完整
    const roundTrip = exposedRef.value!.getTemplate()
    expect(roundTrip.meta).toHaveLength(1)
    expect(roundTrip.datasets).toHaveLength(1)
    expect(roundTrip.datasets![0]).toMatchObject({ id: 'ds-template', label: '订单' })
    expect(roundTrip.datasets![0]!.connection.id).toBe('conn-template')
  })

  it('预览态导出 XLSX 按钮可见且转调查看器 exportXlsx()', async () => {
    const workbook = new Workbook()
    const { el } = mountDesigner(workbook, { template: buildTemplate() })
    await flush()

    // 设计态无导出按钮
    expect(findButton('导出 XLSX')).toBeUndefined()

    await click(findButton('预览模式')!)
    const exportButton = findButton('导出 XLSX')
    expect(exportButton).toBeTruthy()
    await flush()

    const exportModule = await import('../../../report/export-xlsx')
    const catKitFe = await import('@cat-kit/fe')
    const exportSpy = vi
      .spyOn(exportModule, 'exportFilledReportXlsx')
      .mockResolvedValue(new Uint8Array([80, 75, 3, 4]))
    const saveBlobSpy = vi.spyOn(catKitFe, 'saveBlob').mockImplementation(() => {})

    await click(exportButton!)
    expect(exportSpy).toHaveBeenCalled()
    expect(saveBlobSpy).toHaveBeenCalled()
    expect(el.querySelector('.u-report-viewer')).toBeTruthy()

    exportSpy.mockRestore()
    saveBlobSpy.mockRestore()
  })

  it('字段拖拽 dragover 时落点高亮随 hit-test 更新；落空时提示回退当前选区', async () => {
    const workbook = new Workbook()
    workbook.activeSheet.selectCell({ row: 2, col: 1 })
    const { el } = mountDesigner(workbook)
    await flush()

    const gridHost = el.querySelector<HTMLElement>('.u-report-designer__grid')!
    const overlayRect = {
      left: 10,
      top: 20,
      right: 90,
      bottom: 44,
      width: 80,
      height: 24,
      centerX: 50,
      centerY: 32
    }
    const hitTestSpy = vi
      .spyOn(cellCoords, 'resolveGridDropAddress')
      .mockReturnValueOnce({ row: 1, col: 2 })
      .mockReturnValue(null)
    const overlaySpy = vi.spyOn(gridOverlay, 'readCellOverlayRect').mockReturnValue(overlayRect)

    dispatchFieldDragOver(gridHost, 120, 140)
    await flush()
    expect(el.querySelector('.u-report-drop-highlight')).toBeTruthy()
    expect(el.querySelector('.u-report-drop-highlight__fallback')).toBeNull()

    dispatchFieldDragOver(gridHost, 99999, 99999)
    await flush()
    expect(el.querySelector('.u-report-drop-highlight')).toBeNull()
    const fallback = el.querySelector('.u-report-drop-highlight__fallback')
    expect(fallback).toBeTruthy()
    expect(fallback!.textContent).toContain('B3')

    hitTestSpy.mockRestore()
    overlaySpy.mockRestore()
  })
})

describe('UReportDesigner Action Pill', () => {
  const overlayRect = {
    left: 10,
    top: 80,
    right: 90,
    bottom: 104,
    width: 80,
    height: 24,
    centerX: 50,
    centerY: 92
  }

  function spyOverlay() {
    const layoutSpy = vi
      .spyOn(cellCoords, 'resolveGridOverlayLayout')
      .mockReturnValue({
        gridEl: document.createElement('div'),
        layout: { offsetX: 0, offsetY: 77, viewW: 640, viewH: 400 }
      })
    const overlaySpy = vi.spyOn(gridOverlay, 'readCellOverlayRect').mockReturnValue(overlayRect)
    return () => {
      layoutSpy.mockRestore()
      overlaySpy.mockRestore()
    }
  }

  it('小计预设默认条显示聚合、隐藏展开方向，并提供删除绑定', async () => {
    const workbook = new Workbook()
    workbook.activeSheet.setCellMeta({ row: 0, col: 0 }, REPORT_META_NAMESPACE, {
      dataset: 'ds',
      field: 'amount',
      aggregate: 'sum',
      expand: 'none',
      preset: 'subtotal'
    } satisfies ReportBinding)
    workbook.activeSheet.selectCell({ row: 0, col: 0 })

    const restore = spyOverlay()
    const { el } = mountDesigner(workbook)
    await flush()

    const panel = el.querySelector('.u-report-float-panel')
    expect(panel).toBeTruthy()
    expect(panel!.querySelector('.u-report-float-panel__body')).toBeNull()
    expect(panel!.querySelector('.u-report-float-panel__select--aggregate')).toBeTruthy()
    expect(panel!.querySelector('.u-report-float-panel__select--expand')).toBeNull()
    const deleteBtn = [...panel!.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('删除绑定')
    )
    expect(deleteBtn).toBeTruthy()
    restore()
  })

  it('明细预设默认条显示展开方向、隐藏聚合', async () => {
    const workbook = new Workbook()
    workbook.activeSheet.setCellMeta({ row: 0, col: 0 }, REPORT_META_NAMESPACE, {
      dataset: 'ds',
      field: 'orderNo',
      aggregate: 'list',
      expand: 'down',
      preset: 'detail'
    } satisfies ReportBinding)
    workbook.activeSheet.selectCell({ row: 0, col: 0 })

    const restore = spyOverlay()
    const { el } = mountDesigner(workbook)
    await flush()

    const panel = el.querySelector('.u-report-float-panel')
    expect(panel).toBeTruthy()
    expect(panel!.querySelector('.u-report-float-panel__select--expand')).toBeTruthy()
    expect(panel!.querySelector('.u-report-float-panel__select--aggregate')).toBeNull()
    restore()
  })
})
