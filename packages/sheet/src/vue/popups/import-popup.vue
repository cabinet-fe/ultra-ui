<template>
  <u-file-picker accept=".xlsx,.csv" :class="cls.e('import-picker')" @pick="handleImportPick">
    <div :class="cls.e('import-hint')">
      选择 .xlsx / .csv 文件
      <div :class="cls.e('import-sub')">xlsx 将替换当前工作簿（需确认），csv 写入当前工作表</div>
    </div>
  </u-file-picker>
</template>

<script lang="ts" setup>
import { message, messageConfirm, UFilePicker } from '@veltra/desktop'
import { bem, nextFrame } from '@veltra/utils'
import { inject } from 'vue'

import { importCsv, importXlsx, replaceWorkbook } from '../../core/io/import'
import type { Sheet, SheetSnapshot } from '../../core/sheet'
import { Workbook } from '../../core/workbook'
import { SHEET_PARSING_KEY } from '../parsing'
import type { ImportWorkerResponse } from './import.worker'

defineOptions({ name: 'USheetImportPopup' })

/**
 * 导入面板（UFilePicker 文件选择）。不参与面板事务：
 * - .csv → importCsv 直接写入当前活动表（事务 = 单 undo 单元）
 * - .xlsx → importXlsx 解析后经 messageConfirm 确认「替换当前工作簿」再 replaceWorkbook
 */
const props = defineProps<{
  /** 当前工作簿（xlsx 替换目标） */
  workbook: Workbook
  /** 当前活动 sheet（csv 写入目标） */
  activeSheet: Sheet
}>()

const emit = defineEmits<{
  close: []
  /** csv 导入完成（可能扩张 sheet.rows/cols，宿主需重建网格吃到新尺寸） */
  csvImported: []
  /** xlsx 已替换当前工作簿（宿主需同步 tabs / 重绑事件 / 重建网格） */
  workbookReplaced: []
}>()

// xlsx 解析中状态：provide/inject（面板关闭卸载组件后 emit 失效，ref 引用不受影响）
const parsing = inject(SHEET_PARSING_KEY, null)

const cls = bem('sheet')

/**
 * xlsx 解析（worker 优先）：importXlsx 是同步重活（hucre 解析 + 模型构建，
 * 196 sheet / 75 万格实测 3~4s），主线程直接跑会冻结 UI（选完文件后
 * 「3~4s 无反馈才弹确认框」）。移入 Web Worker 后主线程空闲（loading 动画
 * 正常转）；worker 返回纯数据快照（结构化克隆），主线程 restore 重建
 * Workbook（worker 内已做名字唯一化与活动表对齐，重建无 undo 历史——
 * 替换语义由确认后的 replaceWorkbook 负责）。worker 不可用（极端环境）
 * 回退主线程解析。
 */
async function parseXlsxAsync(buffer: ArrayBuffer): Promise<Workbook> {
  let worker: Worker | undefined
  try {
    // new URL 模式：dev（vite）与 build（rolldown）都支持把 worker 提为独立
    // chunk；?worker 虚拟导入在 vp pack（rolldown）下会报 UNLOADABLE_DEPENDENCY。
    // dev 下 import.meta.env.DEV = true → 源 .ts；打包产物（宿主运行时 env 为
    // undefined）→ dist 里经 entry 编译的 .js。onerror 再兜底降级主线程。
    const url = import.meta.env?.DEV
      ? new URL('./import.worker.ts', import.meta.url)
      : new URL('./import.worker.js', import.meta.url)
    worker = new Worker(url, { type: 'module' })
  } catch {
    return importXlsx(new Uint8Array(buffer))
  }
  return await new Promise<Workbook>((resolve, reject) => {
    let settled = false
    // worker 加载/启动失败（如打包产物缺文件）→ 降级主线程解析
    const fallback = () => {
      if (settled) return
      settled = true
      worker!.terminate()
      resolve(importXlsx(new Uint8Array(buffer)))
    }
    worker!.onmessage = (e: MessageEvent<ImportWorkerResponse>) => {
      if (settled) return
      settled = true
      const data = e.data
      if (!data.ok) {
        worker!.terminate()
        reject(new Error(data.error ?? 'worker 解析失败'))
        return
      }
      worker!.terminate()
      const sheets = data.sheets ?? []
      const wb = new Workbook()
      for (let i = 0; i < sheets.length; i++) {
        const { name, snapshot } = sheets[i]!
        const sheet = i === 0 ? wb.activeSheet : wb.addSheet(name)
        sheet.restore(snapshot as SheetSnapshot)
      }
      wb.activateSheet(wb.getSheets()[Math.min(data.activeIndex ?? 0, wb.sheetCount - 1)]!.name)
      resolve(wb)
    }
    worker!.onerror = () => fallback()
    // transfer 一份拷贝给 worker（零结构化克隆开销）；主线程保留原 buffer 供
    // worker 加载失败时降级主线程解析（transfer 后原 buffer 会被 detach，见 #27）
    const transfer = buffer.slice(0)
    worker!.postMessage({ buffer: transfer }, [transfer])
  })
}

function handleImportPick(files: File[]): void {
  const file = files[0]
  if (!file) return
  emit('close')
  if (file.name.toLowerCase().endsWith('.csv')) {
    void file.text().then((text) => {
      importCsv(text, props.activeSheet)
      // 导入扩张了 sheet.rows/cols：通知宿主重建网格（否则仍按旧 props 渲染）
      emit('csvImported')
      message.success(`已从 ${file.name} 导入到工作表「${props.activeSheet.name}」`)
    })
    return
  }
  void file.arrayBuffer().then((buffer) => {
    // 解析（3~5s）在 worker 进行：主线程空闲，宿主 grid 容器挂 v-loading 反馈
    // （loading 动画正常转）；解析完成/失败即移除
    if (parsing) parsing.value = true
    void parseXlsxAsync(buffer)
      .then((imported) => {
        if (parsing) parsing.value = false
        messageConfirm.danger(
          `导入将替换当前工作簿（共 ${imported.sheetCount} 个工作表），确定吗？`,
          {
            confirmButtonText: '导入',
            onClosed: (action) => {
              if (action !== 'confirm') return
              // 弹窗关闭动画（0.25s）完成后才执行 replaceWorkbook：根元素基础
              // transition 修复后 Vue transition-group 检测到过渡，after-leave 在
              // 动画结束触发，onClosed 不再阻塞弹窗关闭。先给常驻反馈：replaceWorkbook
              // 是同步重活（52.8MB / 30 sheet 实测 ~1.6s 主线程阻塞），无提示会
              // 表现为「页面冻结无反馈」；duration: 0 = 不自动关闭。
              const loading = message({ message: '正在导入…', duration: 0 })
              try {
                replaceWorkbook(props.workbook, imported)
                // replaceWorkbook 未必触发 active-sheet-change（同 index）：通知宿主显式同步
                emit('workbookReplaced')
                // 等首帧渲染完成再报「导入完成」：vrender 重建后的首次渲染是同步
                // 阻塞任务（VTable 构造 + 场景渲染，大文件实测 0.6~3s），rAF 会被
                // 它阻塞——等 2 帧后渲染必然已完成。此时才提示成功，用户看到
                // 「导入完成」后立即交互（点单元格/滚动）不再撞上渲染任务
                // （实测未等待时导入后立即点击卡 3~5s，等待后 <50ms）。
                nextFrame(() => {
                  message.success('导入完成')
                  loading.close()
                })
              } catch (err) {
                // 兜底：replaceWorkbook 为同步重活（结构变更 + 逐 sheet 写入），
                // 异常概率低（内存不足等）但失败会留下半替换状态且无法回滚——
                // 至少明确报错，绝不误报成功。
                console.error('[sheet] 导入失败：', err)
                message.error(`导入失败：${err instanceof Error ? err.message : String(err)}`)
                loading.close()
              }
            }
          }
        )
      })
      .catch((err: unknown) => {
        if (parsing) parsing.value = false
        message.error(`文件解析失败：${err instanceof Error ? err.message : String(err)}`)
      })
  })
}
</script>
