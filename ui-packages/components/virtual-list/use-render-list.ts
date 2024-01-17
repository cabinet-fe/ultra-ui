import {
  shallowRef,
  watch,
  type ShallowRef,
  computed,
  shallowReactive
} from 'vue'
import type { VirtualListProps } from '@ui/types/components/virtual-list'
import type { ScrollPosition } from '@ui/types/components/scroll'
interface Options {
  /** 容器模板引用 */
  containerRef: ShallowRef<HTMLElement | undefined>
  /** 虚拟列表组件的props */
  props: VirtualListProps
  /** 虚拟化 */
  virtualization: ShallowRef<boolean>
}

export function useRenderList(options: Options) {
  const { props, containerRef, virtualization } = options

  /** 容器中最大可渲染数量 */
  const renderCounts = computed(() => {
    if (!containerRef.value || !virtualization.value) return 0

    return Math.floor(
      containerRef.value.offsetHeight / (props.itemHeight ?? 32)
    )
  })

  /** 虚拟渲染列表 */
  const renderList = shallowRef<any[]>()

  watch([() => props.data, containerRef], ([data]) => {
    if (!data) return
    if (!virtualization.value) {
      renderList.value = data
      return
    }

    getRenderList({ x: 0, y: 0 })
  })

  const getRenderList = (position: Required<ScrollPosition>) => {
    const { itemHeight, data, bufferSize, virtualThreshold } = props
    if (!data) return

    if (data.length < virtualThreshold!) {
      renderList.value = data
      return
    }

    let start = Math.floor(position.y / (itemHeight ?? 32))
    let end = start + renderCounts.value
    // 要保证每次渲染的数量一致

    let endWithBuffer = end + bufferSize!
    endWithBuffer = endWithBuffer > data.length ? data.length : endWithBuffer

    let startWithBuffer = start - bufferSize!
    startWithBuffer = startWithBuffer < 0 ? 0 : startWithBuffer

    renderList.value = data.slice(startWithBuffer, endWithBuffer)
  }

  // 避免不必要的dom操作而做出的性能优化
  const paddingTop = shallowRef('0')
  const paddingLeft = shallowRef('0')

  watch(paddingTop, paddingTop => {
    containerRef.value!.style.paddingTop = paddingTop
  })
  watch(paddingLeft, paddingLeft => {
    containerRef.value!.style.paddingLeft = paddingLeft
  })

  const setPadding = (position: Required<ScrollPosition>) => {
    paddingTop.value = `${position.y}px`
    paddingLeft.value = `${position.x}px`
  }
  const handleScroll = (position: Required<ScrollPosition>) => {
    if (!virtualization.value) return setPadding({ x: 0, y: 0 })
    getRenderList(position)
    setPadding(position)
  }

  return {
    renderList,
    handleScroll
  }
}
