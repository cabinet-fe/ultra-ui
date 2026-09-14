/** 图层类型（GB/T 33190 Layer@Type） */
export type OfdLayerType = 'background' | 'body' | 'foreground' | 'annotation'

/** 文档基本信息（OFD.xml DocBody/DocInfo，只取识别与展示需要的字段） */
export interface OfdDocInfo {
  docId: string | null
  title: string | null
}

/** 页面尺寸，单位 0.1mm（GB/T 33190 坐标系） */
export interface OfdPageSize {
  width: number
  height: number
}

/** DocumentRes.xml 中的字体声明 */
export interface OfdFontDecl {
  id: string
  fontName: string | null
}

/** DocumentRes.xml 中的多媒体资源声明（本层只登记声明，不加载内容） */
export interface OfdMediaDecl {
  id: string
  /** 'g' 图片 / 'v' 视频 / 'a' 音频 / 's' 流，按声明保留原值 */
  type: string | null
  /** 相对文档根目录的资源路径 */
  location: string | null
}

/** 文档公共资源（DocumentRes.xml） */
export interface OfdDocResources {
  fonts: OfdFontDecl[]
  medias: OfdMediaDecl[]
}

/** Page.xml 的图层声明（P1 只到声明，不含图元对象） */
export interface OfdLayerDecl {
  id: string | null
  type: OfdLayerType | null
}

/** 单页结构化模型 */
export interface OfdPage {
  /** 页序号，从 0 开始 */
  index: number
  /** Page.xml 在容器内的完整路径 */
  location: string
  /** 页面尺寸声明；未声明时用所属文档的默认页尺寸 */
  size: OfdPageSize | null
  layers: OfdLayerDecl[]
}

/** OFD.xml 中一个 DocBody 对应的文档 */
export interface OfdDoc {
  /** 文档根目录，如 'Doc_0'；文档放在容器根目录时为 '' */
  dir: string
  info: OfdDocInfo
  /** Document.xml CommonData 声明的默认页尺寸 */
  pageSize: OfdPageSize | null
  resources: OfdDocResources
  pages: OfdPage[]
}

/** 解析结果：一个 OFD 容器（ZIP）内的全部文档 */
export interface OfdContainer {
  docs: OfdDoc[]
}
