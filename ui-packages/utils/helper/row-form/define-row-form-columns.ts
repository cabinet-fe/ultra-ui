import type {
  RowFormColumn,
  RowFormValidateRule
} from '@ui/types/components/row-form'

/**
 * @param 传入的表头列
 * @param 通用配置 对齐方式 禁用。。。
 */
export function defineRowFormColumns(
  columns: RowFormColumn[],
  config?: Conf
): RowFormColumn[] {
  // let tactics: Record<ColumnPreset, (col: RowFormColumn) => void> = {}

  return columns.map(column => {
    let ret = { ...column }

    /** 所有条目的配置 列优先 */
    if (config) {
      Object.keys(config).forEach(key => {
        if (!ret[key]) {
          ret[key] = config[key]
        }
      })
    }

    return ret
  })
}

// type ColumnPreset = ''

interface Conf {
  /** 没有指定宽度的列的默认的宽度 */
  width?: number
  /** rules校验 required默认false */
  rules?: RowFormValidateRule
}
