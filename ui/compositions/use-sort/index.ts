import { type Ref, type ShallowRef, watch } from 'vue'

interface Content {
  newIndex: number
  oldIndex: number
}

interface Options {
  target:
  // | HTMLElement
  | ShallowRef<HTMLElement | undefined>
  | Ref<HTMLElement | undefined>

  onChange(c: Content): void
}

export function useSort({ target, onChange }: Options) {
  // 实现
  const dragState = {
    oldIndex: 0,
    newIndex: 0,
    dragIndex: 0,
    dragId: 0,
    targetId: 0,
    targetIndex: 0
  }
  watch(
    () => target.value,
    (target) => {
      const children: Element[] = Array.from(target?.children!)
      const exchange = (oldIndex: number, newIndex: number) => {
        target?.insertBefore(children[newIndex]!, children[oldIndex]!)
        target?.insertBefore(children[oldIndex]!, children[newIndex]!.nextSibling)
      }
      children.forEach((child: any, index: number) => {
        // child.setAttribute('draggable', 'true')
        child.setAttribute('drag-id', index)

        child.addEventListener('dragstart', (e) => {
          dragState.oldIndex = e.target.getAttribute('drag-id')
          dragState.dragId = dragState.oldIndex
          dragState.dragIndex = index
        })
        child.addEventListener('drag', (e) => {
          e.preventDefault()
        })
        child.addEventListener('dragover', (e) => {
          e.preventDefault()
        })
        child.addEventListener('dragenter', (e) => {
          e.preventDefault()
          dragState.targetId = e.target.getAttribute('drag-id')
          dragState.targetIndex = index
          if (dragState.dragIndex !== index) {
            if (dragState.targetId > dragState.dragId) {
              exchange(dragState.dragIndex, dragState.targetIndex)
            } else {
              exchange(dragState.targetIndex, dragState.dragIndex)
            }

            children[dragState.targetIndex]?.setAttribute('drag-id', `${dragState.dragId}`)
            children[dragState.dragIndex]?.setAttribute('drag-id', `${dragState.targetId}`)

            dragState.dragId = dragState.targetId
            dragState.newIndex = dragState.targetId
          }
        })
        child.addEventListener('dragend', (e) => {
          e.preventDefault()
          onChange({ newIndex: Number(dragState.newIndex), oldIndex: Number(dragState.oldIndex) })
        })
      })
    }
  )
}
