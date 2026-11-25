import { describe, expect, it } from 'vite-plus/test'

import {
  clipText,
  isSummarizedInHeader,
  lastNonEmptyLine,
  summarizeArguments
} from '../../_shared/tool-format'

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
  it('单标量字段 / 短文本 / 空参数已被头部摘要完整覆盖', () => {
    expect(isSummarizedInHeader({ expression: '128*46' })).toBe(true)
    expect(isSummarizedInHeader({ count: 1200 })).toBe(true)
    expect(isSummarizedInHeader('{"city":"北京"}')).toBe(true)
    expect(isSummarizedInHeader({})).toBe(true)
    expect(isSummarizedInHeader('git status')).toBe(true)
    expect(isSummarizedInHeader(5888)).toBe(true)
  })

  it('多字段、超摘要上限的长值、嵌套结构不算覆盖', () => {
    expect(isSummarizedInHeader({ a: 1, b: 2 })).toBe(false)
    expect(isSummarizedInHeader({ command: 'x'.repeat(80) })).toBe(false)
    expect(isSummarizedInHeader({ file: { path: '/a' } })).toBe(false)
    expect(isSummarizedInHeader('{"target":"/tmp/demo","dryRun":true}')).toBe(false)
  })
})

describe('clipText', () => {
  it('压平空白并截断', () => {
    expect(clipText('a\n\n  b', 10)).toBe('a b')
    expect(clipText('abcdef', 3)).toBe('abc…')
  })
})

describe('lastNonEmptyLine', () => {
  it('从尾部取最后一行非空文本', () => {
    expect(lastNonEmptyLine('first\n  second  \n\n')).toBe('second')
    expect(lastNonEmptyLine('\n\n')).toBe('')
    expect(lastNonEmptyLine('')).toBe('')
  })
})
