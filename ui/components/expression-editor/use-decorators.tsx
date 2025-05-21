import type { LexicalEditor } from 'lexical'
import type { DefineComponent, VNode } from 'vue'
import { Teleport, computed, onBeforeUnmount, shallowRef } from 'vue'

export function useDecorators(editor: LexicalEditor) {
  const decorators = shallowRef(editor.getDecorators<DefineComponent>())

  const removeListener = editor.registerDecoratorListener<DefineComponent>(
    nextDecorators => {
      decorators.value = nextDecorators
    }
  )

  onBeforeUnmount(() => {
    removeListener()
  })

  return computed(() => {
    const decoratedTeleports: VNode[] = []
    const decoratorKeys = Object.keys(decorators.value)
    decoratorKeys.forEach(nodeKey => {
      const node = decorators.value[nodeKey]!
      const element = editor.getElementByKey(nodeKey)
      if (element !== null) {
        decoratedTeleports.push(<Teleport to={element}>{node}</Teleport>)
      }
    })

    return decoratedTeleports
  })
}
