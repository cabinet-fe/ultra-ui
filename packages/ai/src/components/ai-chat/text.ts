/** 文本类小工具：步骤行与思考块共用的轻量纯函数 */

/**
 * 取最后一行非空文本（步骤行 / 思考块折叠态的滚动展示）。
 * 从尾部经 lastIndexOf 反向扫描，不为长文本建行数组，随流式 delta 高频调用无压力。
 */
export function lastNonEmptyLine(text: string): string {
  let end = text.length
  while (end > 0) {
    const start = text.lastIndexOf('\n', end - 1) + 1
    const line = text.slice(start, end).trim()
    if (line) return line
    if (start === 0) return ''
    end = start - 1
  }
  return ''
}
