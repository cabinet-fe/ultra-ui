/** 解析失败的原因分类 */
export type OfdParseErrorReason =
  /** 不是 ZIP 容器（找不到 End of Central Directory） */
  | 'not-zip'
  /** 数据被截断或不完整 */
  | 'truncated'
  /** 中央目录损坏 */
  | 'bad-central-directory'
  /** 本地文件头损坏 */
  | 'bad-local-header'
  | 'unsupported-compression'
  | 'missing-entry'
  | 'invalid-xml'
  /** OFD 结构不合法（缺 DocBody / 缺 DocRoot 等） */
  | 'invalid-structure'

/** OFD 解析失败抛出的类型化错误：靠 `reason` 分类，不靠解析 message */
export class OfdParseError extends Error {
  readonly reason: OfdParseErrorReason

  constructor(reason: OfdParseErrorReason, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'OfdParseError'
    this.reason = reason
  }
}
