import { vi } from 'vitest'
import { createEditor } from 'lexical'
import type { LexicalNode } from 'lexical'
import { VariableNode } from '../nodes/variable-node'

vi.mock('../../tag', () => ({
  UTag: () => null
}))

import { parseContent } from '../parser'

function serializeNodes(nodes: LexicalNode[]): string {
  return nodes.map((n) => n.getTextContent()).join('')
}

function parseAndSerialize(content: string): string {
  const editor = createEditor({
    namespace: 'Test',
    nodes: [VariableNode],
    onError: () => {}
  })
  let serialized = ''
  editor.update(
    () => {
      const nodes = parseContent(content)
      serialized = serializeNodes(nodes)
    },
    { discrete: true }
  )
  return serialized
}

describe('parseContent', () => {
  it('round-trips hello{foo}world (trailing text preserved)', () => {
    const input = 'hello{foo}world'
    expect(parseAndSerialize(input)).toBe(input)
  })

  it('round-trips {a} (single variable)', () => {
    const input = '{a}'
    expect(parseAndSerialize(input)).toBe(input)
  })

  it('round-trips hello (no variables)', () => {
    const input = 'hello'
    expect(parseAndSerialize(input)).toBe(input)
  })

  it('round-trips {a}{b} (adjacent variables)', () => {
    const input = '{a}{b}'
    expect(parseAndSerialize(input)).toBe(input)
  })

  it('round-trips prefix{a}suffix', () => {
    const input = 'prefix{a}suffix'
    expect(parseAndSerialize(input)).toBe(input)
  })

  it('round-trips empty string (refactor behavior consistency)', () => {
    expect(parseAndSerialize('')).toBe('')
  })

  it('preserves text with unclosed brace as plain text (no variable match)', () => {
    const input = 'hello{unclosed'
    expect(parseAndSerialize(input)).toBe(input)
  })
})
