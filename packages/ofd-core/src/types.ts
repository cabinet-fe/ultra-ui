/** 图层类型（GB/T 33190 Layer@Type） */
export type OfdLayerType = 'background' | 'body' | 'foreground' | 'annotation'

/** 文档基本信息（OFD.xml DocBody/DocInfo，只取识别与展示需要的字段） */
export interface OfdDocInfo {
  docId: string | null
  title: string | null
}

/** 页面尺寸，单位毫米（GB/T 33190 坐标系） */
export interface OfdPageSize {
  width: number
  height: number
}

/** DocumentRes.xml 中的字体声明 */
export interface OfdFontDecl {
  id: string
  fontName: string | null
  /** Font@FontFile：内嵌字体文件路径（相对文档根目录）；未内嵌为 null */
  fontFile: string | null
}

/** DocumentRes.xml 中的多媒体资源声明（本层只登记声明，不加载内容） */
export interface OfdMediaDecl {
  id: string
  /** 'g' 图片 / 'v' 视频 / 'a' 音频 / 's' 流；主流产出也有 'Image' 拼写，按声明保留原值 */
  type: string | null
  /** 相对文档根目录的资源路径 */
  location: string | null
}

/** DrawParam 绘制参数声明（供对象与图层引用，Relative 沿链继承） */
export interface OfdDrawParamDecl {
  id: string
  lineWidth: number | null
  /** 引用的父级 DrawParam ID；本声明未写明的属性沿链取父级值 */
  relative: string | null
  fillColor: string | null
  strokeColor: string | null
}

/** 文档公共资源（DocumentRes.xml / PublicRes.xml 合并） */
export interface OfdDocResources {
  fonts: OfdFontDecl[]
  medias: OfdMediaDecl[]
  drawParams: OfdDrawParamDecl[]
}

/** CommonData 声明的文档模板页（TemplatePage@ID + BaseLoc） */
export interface OfdTemplateDecl {
  id: string | null
  /** 模板内容文件路径，相对文档根目录 */
  location: string | null
}

/** 页面内容对模板页的引用（Template@TemplateID） */
export interface OfdTemplateRef {
  templateId: string | null
  /** background：模板内容在页面内容之下；foreground：之上；未声明按 background */
  zOrder: 'background' | 'foreground'
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
  /** CommonData 声明的模板页，页面内容经 Template 引用叠加 */
  templates: OfdTemplateDecl[]
  resources: OfdDocResources
  pages: OfdPage[]
}

/** 解析结果：一个 OFD 容器（ZIP）内的全部文档 */
export interface OfdContainer {
  docs: OfdDoc[]
}
