// import { ref, type Ref, type ShallowRef } from 'vue'

// interface DragOptions {
//   traget: ShallowRef<HTMLElement | undefined> | Ref<HTMLElement | undefined>

//   /** 拖拽开始事件 */
//   onDragStart?(e: MouseEvent, index: number): void

//   /** 当元素或选中的文本被拖到一个可释放目标上时触发（每 100 毫秒触发一次） */
//   onDragOver?(e: MouseEvent): void

//   /** 当拖拽元素或选中的文本到一个可释放目标时触发 */
//   ondragenter?(e: MouseEvent, index: number): void

//   /** 当元素或选中的文本在可释放目标上被释放时触发 */
//   onDrop?(e: MouseEvent, item: any, index: number): void
// }

export default function useDrag(data, dragIndex, enterIndex) {
  console.log(data, 'data')
  // let dragIndex = ref<number>()
  // let enterIndex = ref<number>()

  const onDragStart = (event: MouseEvent, index: number) => {
    dragIndex.value = index

    const dragItem = (event.target as HTMLElement).closest('li')

    if (dragItem) {
      dragItem.classList.add('fade-in')

      requestAnimationFrame(() => {
        dragItem.classList.add('fade-out')

        setTimeout(() => {
          dragItem.classList.remove('fade-out')
        }, 300)
      })
    }
  }

  const onDragOver = event => {
    event.preventDefault()
  }

  const onDragEnter = (event: MouseEvent, index) => {
    enterIndex.value = index
    console.log(index, 'index -- enter')
    console.log(enterIndex.value, 'enterIndex -- enter')
  }

  const onDrop = (event: MouseEvent) => {
    if (dragIndex.value === null || enterIndex.value === null) return
    console.log(data, 'data--')
    console.log(dragIndex.value, 'dragIndex.value')
    console.log(enterIndex.value, 'enterIndex.value')

    // TODO 有点问题，页面数据没排序
    data.splice(dragIndex.value, 1, ...data.splice(enterIndex.value, 1, data[dragIndex.value!]!))

    const dragItem = (event.target as HTMLElement).closest('li')

    if (dragItem) {
      dragItem.classList.remove('fade-in')

      requestAnimationFrame(() => {
        dragItem.classList.remove('fade-out')

        setTimeout(() => {
          dragItem.classList.add('fade-in')
        }, 300)
      })
    }
  }

  return {
    onDragStart,
    onDragOver,
    onDragEnter,
    onDrop
  }
}
