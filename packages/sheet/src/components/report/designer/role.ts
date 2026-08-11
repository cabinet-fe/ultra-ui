import type { ReportBinding, ReportRole } from '../../../report/types'

const ROLE_LABELS: Record<ReportRole, string> = {
  group: '分组头',
  detail: '明细行',
  subtotal: '小计行',
  grandTotal: '总计行',
  matrix: '矩阵交叉'
}

export const REPORT_ROLE_OPTIONS = (Object.entries(ROLE_LABELS) as Array<[ReportRole, string]>).map(
  ([value, label]) => ({ value, label })
)

export function roleLabel(role: ReportRole): string {
  return ROLE_LABELS[role]
}

/** 切换语义角色时同步 aggregate / expand / leftParent 默认值 */
export function roleBindingDefaults(role: ReportRole): Partial<ReportBinding> {
  switch (role) {
    case 'group':
      return { role, aggregate: 'group', expand: 'down', leftParent: 'none' }
    case 'detail':
      return { role, aggregate: 'select', expand: 'down', leftParent: 'default' }
    case 'subtotal':
      return { role, aggregate: 'sum', expand: 'none', leftParent: 'default' }
    case 'grandTotal':
      return { role, aggregate: 'sum', expand: 'none', leftParent: 'none' }
    case 'matrix':
      return { role, aggregate: 'sum', expand: 'none', leftParent: 'none' }
  }
}
