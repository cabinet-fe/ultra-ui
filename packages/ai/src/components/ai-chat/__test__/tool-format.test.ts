import { describe, expect, it } from 'vite-plus/test'

import {
  clipText,
  describeShape,
  dropEchoedFields,
  humanizeKey,
  isSummarizedInHeader,
  summarizeArguments,
  toToolNode,
  unwrapSingleValue
} from '../tool-format'

describe('humanizeKey', () => {
  it('拆开 snake_case / camelCase / 缩写，首字母大写', () => {
    expect(humanizeKey('file_path')).toBe('File Path')
    expect(humanizeKey('filePath')).toBe('File Path')
    expect(humanizeKey('userID')).toBe('User ID')
    expect(humanizeKey('cmd')).toBe('Cmd')
  })

  it('中文键原样保留，空键返回空串', () => {
    expect(humanizeKey('文件路径')).toBe('文件路径')
    expect(humanizeKey('  ')).toBe('')
  })
})

describe('toToolNode', () => {
  it('对象转字段行，键名已人读化', () => {
    const node = toToolNode({ file_path: 'src/a.ts', ok: true, count: 1200 })
    expect(node.type).toBe('fields')
    if (node.type !== 'fields') return
    expect(node.fields.map((f) => f.label)).toEqual(['File Path', 'Ok', 'Count'])
    expect(node.fields[0]?.value).toEqual({ type: 'text', text: 'src/a.ts', code: true })
    expect(node.fields[1]?.value).toEqual({ type: 'scalar', text: '是', tone: 'bool' })
    // 数字千分位，读量级不用数位数
    expect(node.fields[2]?.value).toEqual({ type: 'scalar', text: '1,200', tone: 'number' })
  })

  it('纯标量数组压成 chips，对象数组保留序号列表', () => {
    const chips = toToolNode(['a.ts', 'b.ts'])
    expect(chips).toEqual({ type: 'chips', items: ['a.ts', 'b.ts'] })

    const list = toToolNode([{ id: 1 }, { id: 2 }])
    expect(list.type).toBe('list')
  })

  it('字符串里的 JSON 会被展开，普通文本保持原文', () => {
    const nested = toToolNode('{"a":1}')
    expect(nested.type).toBe('fields')

    const plain = toToolNode('git status --short')
    expect(plain).toEqual({ type: 'text', text: 'git status --short', code: true })
  })

  it('空值与不可读值不产生噪声节点', () => {
    expect(toToolNode(null).type).toBe('empty')
    expect(toToolNode(undefined).type).toBe('empty')
    expect(toToolNode({}).type).toBe('empty')
    expect(toToolNode([]).type).toBe('empty')
    expect(toToolNode('   ').type).toBe('empty')
  })

  it('循环引用外的异常输入不得 throw', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(() => toToolNode(circular)).not.toThrow()
  })
})

describe('summarizeArguments', () => {
  it('优先取最能说明调用的参数键', () => {
    expect(summarizeArguments({ command: 'git status', cwd: '/tmp' })).toBe('git status')
    expect(summarizeArguments({ path: '/tmp/a.log', mode: 'delete' })).toBe('/tmp/a.log')
    expect(summarizeArguments('{"query":"vue3"}')).toBe('vue3')
  })

  it('无优先键时退到首个字符串，非对象输入按原文截断', () => {
    expect(summarizeArguments({ foo: 'hello' })).toBe('hello')
    expect(summarizeArguments('随便一段话')).toBe('随便一段话')
    expect(summarizeArguments(undefined)).toBe('')
  })

  it('超长摘要截断并加省略号', () => {
    const summary = summarizeArguments({ command: 'x'.repeat(200) })
    expect(summary.endsWith('…')).toBe(true)
    expect(summary.length).toBe(61)
  })
})

describe('isSummarizedInHeader', () => {
  it('单标量字段 / 短文本参数已被头部摘要完整覆盖', () => {
    expect(isSummarizedInHeader(toToolNode({ expression: '128*46' }))).toBe(true)
    expect(isSummarizedInHeader(toToolNode({ count: 1200 }))).toBe(true)
    expect(isSummarizedInHeader(toToolNode('git status'))).toBe(true)
    expect(isSummarizedInHeader(toToolNode(5888))).toBe(true)
  })

  it('多字段、超摘要上限的长值、嵌套结构不算覆盖', () => {
    expect(isSummarizedInHeader(toToolNode({ a: 1, b: 2 }))).toBe(false)
    expect(isSummarizedInHeader(toToolNode({ command: 'x'.repeat(80) }))).toBe(false)
    expect(isSummarizedInHeader(toToolNode({ file: { path: '/a' } }))).toBe(false)
  })
})

describe('dropEchoedFields', () => {
  it('剔除结果里同键同值回显入参的字段', () => {
    const result = toToolNode({ expression: '128*46', result: 5888 })
    expect(dropEchoedFields(result, { expression: '128*46' })).toEqual(toToolNode({ result: 5888 }))
  })

  it('值不同或无对应入参时原样返回，全部是回显时得到空节点', () => {
    expect(dropEchoedFields(toToolNode({ a: 1 }), { b: 1 })).toEqual(toToolNode({ a: 1 }))
    expect(dropEchoedFields(toToolNode({ a: 1 }), { a: 2 })).toEqual(toToolNode({ a: 1 }))
    expect(dropEchoedFields(toToolNode({ a: 1, b: 2 }), { a: 1 })).toEqual(toToolNode({ b: 2 }))
    expect(dropEchoedFields(toToolNode({ a: 1 }), { a: 1 }).type).toBe('empty')
    // 非对象入参无从比对，不做去重
    expect(dropEchoedFields(toToolNode({ a: 1 }), 'x').type).toBe('fields')
  })
})

describe('unwrapSingleValue', () => {
  it('通用值键的单标量结果直出值本身', () => {
    expect(unwrapSingleValue(toToolNode({ result: 5888 }))).toEqual({
      type: 'scalar',
      text: '5,888',
      tone: 'number'
    })
    expect(unwrapSingleValue(toToolNode({ output: 'done' }))).toEqual({
      type: 'text',
      text: 'done',
      code: false
    })
  })

  it('语义键、布尔值、多字段保留字段行', () => {
    expect(unwrapSingleValue(toToolNode({ remaining: 3 })).type).toBe('fields')
    expect(unwrapSingleValue(toToolNode({ ok: true })).type).toBe('fields')
    expect(unwrapSingleValue(toToolNode({ value: true })).type).toBe('fields')
    expect(unwrapSingleValue(toToolNode({ a: 1, b: 2 })).type).toBe('fields')
  })
})

describe('describeShape', () => {
  it('列表与多行文本给出量级提示，字段行不报数', () => {
    expect(describeShape(toToolNode({ a: 1, b: 2 }))).toBe('')
    expect(describeShape(toToolNode(['a', 'b', 'c']))).toBe('3 项')
    expect(describeShape(toToolNode('line1\nline2\nline3'))).toBe('3 行')
    expect(describeShape(toToolNode('single'))).toBe('')
  })
})

describe('clipText', () => {
  it('压平空白并截断', () => {
    expect(clipText('a\n\n  b', 10)).toBe('a b')
    expect(clipText('abcdef', 3)).toBe('abc…')
  })
})
