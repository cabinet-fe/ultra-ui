import { completeFromList, type Completion } from '@codemirror/autocomplete'

/** SpEL 关键字与常用内置标识补全 */
const SPEL_COMPLETIONS: Completion[] = [
  // 字面量
  { label: 'true', type: 'constant' },
  { label: 'false', type: 'constant' },
  { label: 'null', type: 'constant' },
  // 关键字 / 运算符词
  { label: 'and', type: 'keyword' },
  { label: 'or', type: 'keyword' },
  { label: 'not', type: 'keyword' },
  { label: 'eq', type: 'keyword' },
  { label: 'ne', type: 'keyword' },
  { label: 'lt', type: 'keyword' },
  { label: 'le', type: 'keyword' },
  { label: 'gt', type: 'keyword' },
  { label: 'ge', type: 'keyword' },
  { label: 'matches', type: 'keyword' },
  { label: 'between', type: 'keyword' },
  { label: 'instanceof', type: 'keyword' },
  { label: 'new', type: 'keyword' },
  // 类型引用与上下文变量
  { label: 'T', type: 'type', detail: 'T(Type)', info: '类型引用' },
  { label: '#this', type: 'variable', detail: '当前上下文' },
  { label: '#root', type: 'variable', detail: '根对象' }
]

/** 基于关键字列表的补全源 */
export const spelCompletion = completeFromList(SPEL_COMPLETIONS)
