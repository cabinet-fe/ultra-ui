/**
 * 校验文件是否匹配 accept 字符串（支持 MIME 类型与通配符）。
 *
 * 支持的形式：
 * - `*` / `*\/*`：接受所有文件
 * - `image/*`：MIME 类型组匹配
 * - `application/pdf`：精确 MIME 类型
 * - `.pdf` / `.docx`：扩展名匹配（不区分大小写）
 *
 * 多个值以逗号分隔，命中任一即视为匹配。
 */
export function matchAccept(file: File, accept?: string): boolean {
  if (!accept) return true

  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()
  const acceptList = accept
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  if (!acceptList.length) return true

  return acceptList.some((item) => {
    if (item === '*' || item === '*/*') return true
    if (item.startsWith('.')) return fileName.endsWith(item)
    if (item.endsWith('/*')) {
      const group = item.slice(0, -2)
      return fileType.startsWith(`${group}/`)
    }
    return fileType === item
  })
}
