import {
  SheetGrid as EngineSheetGrid,
  type SheetGridOptions as EngineSheetGridOptions
} from 'infinitable/sheet'

import type { Sheet } from '../core/sheet'

/**
 * SheetGrid 门面桥接：实现整体迁移官方 `infinitable/sheet`（上游化产物），
 * 本文件仅为类型收口——官方 `SheetGridOptions.sheet` 要求官方 Sheet 类，
 * 与本仓 core Sheet 同源同构但类私有成员名义隔离，构造期一次断言转换。
 * 行为全部继承官方实现，无任何行为复刻。
 */
export interface SheetGridOptions extends Omit<EngineSheetGridOptions, 'sheet'> {
  sheet: Sheet
}

export class SheetGrid extends EngineSheetGrid {
  constructor(options: SheetGridOptions) {
    // 公共面（成员/事件/签名）与官方 Sheet 逐一对齐，私有成员名义差异经 unknown 收口
    super(options as unknown as EngineSheetGridOptions)
  }
}
