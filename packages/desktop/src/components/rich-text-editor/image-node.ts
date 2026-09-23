import {
  $insertNodes,
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread
} from 'lexical'

let imageUid = 0

function nextImageId(): string {
  return `rte-img-${++imageUid}`
}

export interface SerializedImageNode extends Spread<
  { src: string; alt: string; id: string },
  SerializedLexicalNode
> {}

/**
 * 图片节点：插入时 src 为本地 objectURL、__file 持有原始文件，提交前由宿主调用
 * uploadImages 换成服务器地址。__file 不参与序列化，仅会话内有效。
 * 本仓库为手写 Vue 绑定（无 React 适配层），不走 decorate 渲染管道，
 * createDOM 直接返回 <img> 元素。
 */
export class ImageNode extends DecoratorNode<void> {
  __src: string
  __alt: string
  __id: string
  __file: File | null

  static override getType(): string {
    return 'u-image'
  }

  static override clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__id, node.__file, node.__key)
  }

  static override importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode({
      src: serializedNode.src,
      alt: serializedNode.alt,
      id: serializedNode.id
    })
  }

  constructor(src: string, alt = '', id = nextImageId(), file: File | null = null, key?: NodeKey) {
    super(key)
    this.__src = src
    this.__alt = alt
    this.__id = id
    this.__file = file
  }

  static override importDOM(): DOMConversionMap | null {
    return { img: () => ({ conversion: convertImageElement, priority: 0 }) }
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('img')
    element.setAttribute('src', this.__src)
    element.setAttribute('class', 'u-rte-image')
    element.setAttribute('alt', this.__alt)
    element.setAttribute('data-rte-image-id', this.__id)
    return { element }
  }

  override exportJSON(): SerializedImageNode {
    return { type: 'u-image', version: 1, src: this.__src, alt: this.__alt, id: this.__id }
  }

  override createDOM(): HTMLElement {
    const element = document.createElement('img')
    element.className = 'u-rte-image'
    element.src = this.__src
    element.alt = this.__alt
    element.draggable = false
    return element
  }

  override updateDOM(prevNode: ImageNode, element: HTMLElement): boolean {
    const img = element as HTMLImageElement
    if (prevNode.__src !== this.__src) img.src = this.__src
    if (prevNode.__alt !== this.__alt) img.alt = this.__alt
    return false
  }

  /** Vue 环境无 React 渲染管道，装饰内容即 createDOM 返回的元素本身 */
  override decorate(): null {
    return null
  }

  getSrc(): string {
    return this.__src
  }

  getFile(): File | null {
    return this.__file
  }

  /** 替换为服务器地址，同时清除待上传标记（已上传的节点不再重复上传） */
  setSrc(src: string): void {
    const self = this.getWritable()
    self.__src = src
    self.__file = null
  }
}

function convertImageElement(domNode: HTMLElement): DOMConversionOutput {
  const src = domNode.getAttribute('src')
  if (!src) return { node: null }
  return {
    node: $createImageNode({
      src,
      alt: domNode.getAttribute('alt') ?? '',
      id: domNode.getAttribute('data-rte-image-id') ?? undefined
    })
  }
}

export function $createImageNode(options: {
  src: string
  alt?: string
  id?: string
  file?: File | null
}): ImageNode {
  return new ImageNode(
    options.src,
    options.alt ?? '',
    options.id ?? nextImageId(),
    options.file ?? null
  )
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode
}

// 各编辑器实例创建的图片 objectURL，用于节点删除 / 组件卸载时回收
const objectUrls = new WeakMap<LexicalEditor, Set<string>>()

function getImageObjectUrls(editor: LexicalEditor): Set<string> {
  let urls = objectUrls.get(editor)
  if (!urls) {
    urls = new Set()
    objectUrls.set(editor, urls)
  }
  return urls
}

/** 插入图片文件：objectURL 即时预览，File 挂在节点上等待提交时上传。返回插入的图片数量 */
export function insertImageFiles(editor: LexicalEditor, files: File[] | FileList): number {
  const images = Array.from(files).filter((file) => file.type.startsWith('image/'))
  if (!images.length) return 0

  const urls = getImageObjectUrls(editor)

  editor.update(() => {
    const nodes = images.map((file) => {
      const url = URL.createObjectURL(file)
      urls.add(url)
      return $createImageNode({ src: url, alt: file.name, file })
    })
    $insertNodes(nodes)
  })

  return images.length
}

/** 回收已从内容中移除的图片 objectURL，aliveUrls 为当前内容中仍存活的图片地址 */
export function gcImageObjectUrls(editor: LexicalEditor, aliveUrls: Set<string>): void {
  const urls = objectUrls.get(editor)
  if (!urls?.size) return
  urls.forEach((url) => {
    if (!aliveUrls.has(url)) {
      URL.revokeObjectURL(url)
      urls.delete(url)
    }
  })
}

/** 回收该编辑器创建的全部图片 objectURL（组件卸载时调用） */
export function revokeImageObjectUrls(editor: LexicalEditor): void {
  const urls = objectUrls.get(editor)
  urls?.forEach((url) => URL.revokeObjectURL(url))
  objectUrls.delete(editor)
}
