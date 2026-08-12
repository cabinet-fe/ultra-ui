import type { CellStyle, SheetSnapshot } from '@veltra/sheet-core'
import { StylePool } from '@veltra/sheet-core'
import { mergeCellStyle } from '@veltra/sheet-core/core/command/set-cell-style'

import { evaluateConditionalStyle, type ConditionalEvalContext } from '../rules'
import type { ConditionalRule } from '../types'

/** 静态样式经 StylePool 复用 + 条件样式打平（含 `scope: 'row'` 两阶段叠加） */
export class StyleResolver {
  private readonly pool = new StylePool()
  private readonly rowStyleByPhysRow = new Map<number, CellStyle>()

  constructor(private readonly template: SheetSnapshot) {
    if (template.styles.length > 0) this.pool.restore(template.styles)
  }

  /** 收集 `scope: 'row'` 命中样式，按物理行累加（须在输出静态格之前完成） */
  collectRowStyle(
    physicalRow: number,
    ctx: ConditionalEvalContext,
    rules: readonly ConditionalRule[] | undefined
  ): void {
    if (!rules?.some((rule) => rule.scope === 'row')) return

    const patch = evaluateConditionalStyle(ctx, undefined, rules, 'row')
    if (!patch) return

    const existing = this.rowStyleByPhysRow.get(physicalRow)
    this.rowStyleByPhysRow.set(physicalRow, mergeCellStyle(existing, patch) ?? patch)
  }

  /** 解析模板格基础样式 + `scope: 'cell'` 条件样式 */
  resolveCell(
    templateRow: number,
    templateCol: number,
    ctx: ConditionalEvalContext,
    rules: readonly ConditionalRule[] | undefined
  ): number | undefined {
    const tpl = this.template.cells.find((c) => c.row === templateRow && c.col === templateCol)
    const baseStyle = tpl?.s !== undefined ? this.pool.get(tpl.s) : undefined
    const merged = evaluateConditionalStyle(ctx, baseStyle, rules, 'cell')
    if (!merged) return tpl?.s
    if (merged === baseStyle) return tpl?.s
    return this.pool.intern(merged)
  }

  /** 无绑定的静态格：仅模板样式 */
  resolveStatic(templateRow: number, templateCol: number): number | undefined {
    const tpl = this.template.cells.find((c) => c.row === templateRow && c.col === templateCol)
    return tpl?.s
  }

  /** 将行级样式叠加到格级样式 id */
  mergeRowStyle(styleId: number | undefined, physicalRow: number): number | undefined {
    const rowPatch = this.rowStyleByPhysRow.get(physicalRow)
    if (!rowPatch) return styleId

    const base = styleId !== undefined ? this.pool.get(styleId) : undefined
    const merged = mergeCellStyle(base, rowPatch)
    if (!merged) return styleId
    if (merged === base) return styleId
    return this.pool.intern(merged)
  }

  snapshot(): CellStyle[] {
    return this.pool.snapshot()
  }
}
