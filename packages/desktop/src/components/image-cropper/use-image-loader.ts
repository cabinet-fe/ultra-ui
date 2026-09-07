import { onBeforeUnmount, shallowRef, watch, type ShallowRef } from 'vue'

interface UseImageLoaderOptions {
  /** 图片源（File / Blob / URL） */
  src: () => File | Blob | string | undefined
}

interface UseImageLoaderReturn {
  /** 用于渲染的图片地址 */
  imageUrl: ShallowRef<string>
  /** 是否加载完成 */
  loaded: ShallowRef<boolean>
  /** 是否加载失败 */
  error: ShallowRef<boolean>
  /** 图片原始宽度 */
  naturalWidth: ShallowRef<number>
  /** 图片原始高度 */
  naturalHeight: ShallowRef<number>
}

/** 加载 File / Blob / URL 图片源，File / Blob 走 objectURL 并在替换与卸载时释放 */
export function useImageLoader(options: UseImageLoaderOptions): UseImageLoaderReturn {
  const { src } = options

  const imageUrl = shallowRef('')
  const loaded = shallowRef(false)
  const error = shallowRef(false)
  const naturalWidth = shallowRef(0)
  const naturalHeight = shallowRef(0)

  let objectUrl: string | undefined

  function revokeObjectUrl() {
    if (!objectUrl) return
    URL.revokeObjectURL(objectUrl)
    objectUrl = undefined
  }

  function load(source: File | Blob | string | undefined) {
    revokeObjectUrl()
    imageUrl.value = ''
    loaded.value = false
    error.value = false
    naturalWidth.value = 0
    naturalHeight.value = 0

    if (!source) return

    const url = typeof source === 'string' ? source : (objectUrl = URL.createObjectURL(source))
    const el = new Image()
    // URL 源尽量走跨域匿名加载，保证后续画布导出不被污染
    if (typeof source === 'string') el.crossOrigin = 'anonymous'

    el.onload = () => {
      naturalWidth.value = el.naturalWidth
      naturalHeight.value = el.naturalHeight
      loaded.value = true
    }
    el.onerror = () => {
      error.value = true
      imageUrl.value = ''
    }
    el.src = url
    imageUrl.value = url
  }

  watch(src, load, { immediate: true })

  onBeforeUnmount(() => {
    revokeObjectUrl()
  })

  return { imageUrl, loaded, error, naturalWidth, naturalHeight }
}
