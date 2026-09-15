import { describe, expect, it } from 'vitest'

import { FILE_VIEWER_KIND_LABEL, inferKind } from '../helper'

describe('file-viewer helper', () => {
  it('.ofd 按 OFD 类别识别，不落入 text 兜底', () => {
    expect(inferKind('invoice.ofd')).toBe('ofd')
  })

  it('OFD 类别的展示标签为 OFD', () => {
    expect(FILE_VIEWER_KIND_LABEL.ofd).toBe('OFD')
  })
})
