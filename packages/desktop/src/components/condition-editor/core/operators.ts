export interface OperatorDef {
  label: string
  value: string
  needValue: boolean
}

const STRING_OPERATORS: OperatorDef[] = [
  { label: '等于', value: 'eq', needValue: true },
  { label: '不等于', value: 'ne', needValue: true },
  { label: '包含', value: 'contains', needValue: true },
  { label: '不包含', value: 'not_contains', needValue: true },
  { label: '为空', value: 'empty', needValue: false },
  { label: '不为空', value: 'not_empty', needValue: false }
]

const NUMBER_OPERATORS: OperatorDef[] = [
  { label: '等于', value: 'eq', needValue: true },
  { label: '不等于', value: 'ne', needValue: true },
  { label: '大于', value: 'gt', needValue: true },
  { label: '小于', value: 'lt', needValue: true },
  { label: '大于等于', value: 'gte', needValue: true },
  { label: '小于等于', value: 'lte', needValue: true }
]

const BOOLEAN_OPERATORS: OperatorDef[] = [
  { label: '是', value: 'is_true', needValue: false },
  { label: '否', value: 'is_false', needValue: false }
]

const DATE_OPERATORS: OperatorDef[] = [
  { label: '等于', value: 'eq', needValue: true },
  { label: '不等于', value: 'ne', needValue: true },
  { label: '早于', value: 'before', needValue: true },
  { label: '晚于', value: 'after', needValue: true }
]

const ENUM_OPERATORS: OperatorDef[] = [
  { label: '等于', value: 'eq', needValue: true },
  { label: '不等于', value: 'ne', needValue: true },
  { label: '包含于', value: 'in', needValue: true }
]

const OPERATOR_MAP: Record<string, OperatorDef[]> = {
  string: STRING_OPERATORS,
  number: NUMBER_OPERATORS,
  boolean: BOOLEAN_OPERATORS,
  date: DATE_OPERATORS,
  enum: ENUM_OPERATORS
}

export function getOperatorsByFieldType(type: string): OperatorDef[] {
  return OPERATOR_MAP[type] ?? STRING_OPERATORS
}

export function getOperatorDef(type: string, operator: string): OperatorDef | undefined {
  return getOperatorsByFieldType(type).find((op) => op.value === operator)
}
