// TODO: 在多种场景下, 比较KMP算法, BM算法, two-way算法是否比正则更快

interface HighlightChunk {
  text: string
  highlight: boolean
}

const escapeRegexp = (term: string): string =>
  term.replace(/[|\\{}()[\]^$+*?.-]/g, (char: string) => `\\${char}`)

export function getHighlightChunks(str: string, substrings: string[]): HighlightChunk[] {
  const _substrings = substrings.filter((s) => !!s).map((s) => escapeRegexp(s.trim()))
  const re = new RegExp(`(${_substrings.join('|')})`, 'gi')
  return str
    .split(re)
    .filter(Boolean)
    .map((text) => ({ text, highlight: re.test(text) }))
}
