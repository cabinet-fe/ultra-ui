import type {
  RowFormColumn,
  RowFormValidateRule
} from '@ui/types/components/row-form'
import { shallowRef, type ShallowRef } from 'vue'

/**
 * @param 传入的表头列
 * @param 通用配置 对齐方式 禁用。。。
 */
export function defineRowFormColumns(
  columns: RowFormColumn[],
  config?: Conf
): ShallowRef<RowFormColumn[]> {
  // let tactics: Record<ColumnPreset, (col: RowFormColumn) => void> = {}
  let columnsMap = columns.map(column => {
    let ret = { ...column }

    /** 所有条目的配置 列优先级别比这个高 */
    if (config) {
      Object.keys(config).forEach(key => {
        if (!ret[key]) {
          ret[key] = config[key]
        }
      })
    }

    return ret
  })

  return shallowRef(columnsMap)
}

// type ColumnPreset = ''

interface Conf {
  /** 没有指定宽度的列的默认的宽度 */
  width?: number
  /** rules校验 required默认false */
  rules?: RowFormValidateRule
}
