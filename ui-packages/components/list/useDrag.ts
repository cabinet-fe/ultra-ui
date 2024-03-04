import { ref } from 'vue'

export default function useDrag(items: any) {
  /**
   * 拖拽索引
   */
  const dragIndex: any = ref(null)

  /**
   * 拖拽开始
   * @param e
   * @param index
   */
  const onDragStart = (index: number) => {
    dragIndex.value = index
  }

  /**
   * ondragover事件在拖动元素在目标元素上方时触发，通常用于防止默认的拖放行为。
   * 可以通过event.preventDefault()方法阻止默认行为。
   * @param e
   * @param index
   */
  const onDragOver = (e: any) => {
    e.preventDefault()
  }

  /**
   * 拖拽结束
   * @param e
   *
   */
  const onDrop = (e: any) => {
    const dropIndex = e.target.dataset.index

    const dragItem = items[dragIndex.value]

    items.splice(dragIndex.value, 1)

    items.splice(dropIndex, 0, dragItem)
  }
  return { dragIndex, onDragStart, onDragOver, onDrop }
}
