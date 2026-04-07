/**
 * 校验文件是否匹配 accept 字符串 (仅支持 MIME 类型)
 * @param file 文件对象
 * @param accept 接受的文件类型，例如：image/*,application/pdf
 */
export function matchAccept(file: File, accept?: string): boolean {
  if (!accept) return true

  const fileType = file.type.toLowerCase()
  const acceptList = accept.split(',').map(item => item.trim().toLowerCase())

  return acceptList.some(item => {
    if (item.endsWith('/*')) {
      // MIME 类型组匹配 (例如：image/*)
      const group = item.replace('/*', '')
      return fileType.startsWith(group)
    } else {
      // MIME 类型精确匹配
      return fileType === item
    }
  })
}
