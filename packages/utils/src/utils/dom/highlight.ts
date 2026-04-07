// TODO: 在多种场景下, 比较KMP算法, BM算法, two-way算法是否比正则更快

interface HighlightChunk {
  text: string
  highlight: boolean
}

const escapeRegexp = (term: string): string =>
  term.replace(/[|\\{}()[\]^$+*?.-]/g, (char: string) => `\\${char}`)

/**
 * 获取文本高亮片段
 * @param string 字符串
 * @param substrings 需要匹配的字串列表
 */
export function getHighlightChunks(str: string, substrings: string[]): HighlightChunk[] {
  const _substrings = substrings
    .filter(s => !!s)
    .map(s => escapeRegexp(s.trim()))
  const re = new RegExp(`(${_substrings.join('|')})`, 'gi')
  return str
    .split(re)
    .filter(Boolean)
    .map(text => ({ text, highlight: re.test(text) }))
}
