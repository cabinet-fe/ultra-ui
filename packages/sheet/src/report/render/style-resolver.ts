import type { CellStyle, SheetSnapshot } from '@veltra/sheet-core'
import { StylePool } from '@veltra/sheet-core'

import { evaluateConditionalStyle } from '../rules'
import type { ReportBinding } from '../types'

/** 静态样式经 StylePool 复用 + 条件样式打平 */
export class StyleResolver {
  private readonly pool = new StylePool()

  constructor(private readonly template: SheetSnapshot) {
    if (template.styles.length > 0) this.pool.restore(template.styles)
  }

  resolve(
    templateRow: number,
    templateCol: number,
    cellValue: unknown,
    binding?: ReportBinding
  ): number | undefined {
    const tpl = this.template.cells.find((c) => c.row === templateRow && c.col === templateCol)
    const baseStyle = tpl?.s !== undefined ? this.pool.get(tpl.s) : undefined
    const merged = evaluateConditionalStyle(cellValue, baseStyle, binding?.conditionalRules)
    if (!merged) return tpl?.s
    if (merged === baseStyle) return tpl?.s
    return this.pool.intern(merged)
  }

  snapshot(): CellStyle[] {
    return this.pool.snapshot()
  }
}
