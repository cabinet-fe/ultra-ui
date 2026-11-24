import { onBeforeUnmount, shallowRef, watch, type ShallowRef } from 'vue'

interface UseImageLoaderOptions {
  src: () => File | Blob | string | undefined
}

interface UseImageLoaderReturn {
  imageUrl: ShallowRef<string>
  loaded: ShallowRef<boolean>
  error: ShallowRef<boolean>
  naturalWidth: ShallowRef<number>
  naturalHeight: ShallowRef<number>
  /** 已加载完成的图片元素，供画布绘制（预览 / getResult 输出） */
  imageEl: ShallowRef<HTMLImageElement | undefined>
}

/** 加载 File / Blob / URL 图片源，File / Blob 走 objectURL 并在替换与卸载时释放 */
export function useImageLoader(options: UseImageLoaderOptions): UseImageLoaderReturn {
  const { src } = options

  const imageUrl = shallowRef('')
  const loaded = shallowRef(false)
  const error = shallowRef(false)
  const naturalWidth = shallowRef(0)
  const naturalHeight = shallowRef(0)
  const imageEl = shallowRef<HTMLImageElement>()

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
    imageEl.value = undefined

    if (!source) return

    const url = typeof source === 'string' ? source : (objectUrl = URL.createObjectURL(source))
    const el = new Image()
    // URL 源尽量走跨域匿名加载，保证后续画布导出不被污染
    if (typeof source === 'string') el.crossOrigin = 'anonymous'

    el.onload = () => {
      naturalWidth.value = el.naturalWidth
      naturalHeight.value = el.naturalHeight
      imageEl.value = el
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

  return { imageUrl, loaded, error, naturalWidth, naturalHeight, imageEl }
}
