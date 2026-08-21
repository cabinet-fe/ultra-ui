import type { SheetSnapshot } from '../sheet'
import type { Command } from './types'

/**
 * 整表快照替换命令（导入 replaceWorkbookWithSnapshots / 外部快照恢复）。
 *
 * - redo = 应用目标快照（SnapshotPatch：restoreContent 静默整表替换，不发逐格
 *   cell-change——导入/undo 场景避免十万级视图同步；发 content-reset 供视图层全量刷新）
 * - undo = 还原操作前快照（before，命令执行时捕获）
 * - 只替换 cells/styles/merges/rowStyles/colStyles（+ 公式图重建）；
 *   冻结/行高/列宽/尺寸/选区保持当前
 *   （对齐「冻结与行高/列宽不进 undo」「选区不进 undo」「渲染尺寸不进 undo」约定）
 * - redo 侧首次执行时 ensureTableSize 扩张尺寸（回放不重复——undo 不动尺寸，
 *   redo 保持）
 * - 公式重算由 Sheet.executeCommand 的 recalcAfterCommand 统一编排
 *   （snapshot patch 的快照全部格视为变更格，跨表引用方联动，派生补丁并入同
 *   一 undo 单元）
 */
export const RestoreSheetCommand: Command<{ snapshot: SheetSnapshot }> = {
  id: 'sheet.restore-sheet',
  handler(ctx, { snapshot }) {
    const before = ctx.sheet.snapshot()
    ctx.applyPatch({ kind: 'snapshot', snapshot }, 'redo')
    // 尺寸扩张（max 合并，不进 undo、不发事件；undo/redo 回放不还原尺寸）
    ctx.sheet.ensureTableSize(snapshot.rows, snapshot.cols)
    // 冻结是模型状态（随快照序列化；不进 undo：redo 侧应用快照值，
    // undo/redo 回放不动）
    ctx.sheet.setFrozen(snapshot.frozen.rows, snapshot.frozen.cols)
    return {
      mutations: [
        { redo: [{ kind: 'snapshot', snapshot }], undo: [{ kind: 'snapshot', snapshot: before }] }
      ]
    }
  }
}
