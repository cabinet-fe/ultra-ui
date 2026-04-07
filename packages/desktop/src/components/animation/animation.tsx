import {
  defineComponent,
  type DefineComponent,
  inject,
  provide,
  Transition
} from 'vue'
import type { AnimationProps } from '@ultra-ui/desktop/types'
import { AnimationDIKey } from './di'

const Animation: DefineComponent<AnimationProps> = defineComponent({
  name: 'Animation',
  props: ['tag'],
  setup(props, { slots }) {
    const { aid } = inject(AnimationDIKey, undefined) || {}

    provide(AnimationDIKey, {
      aid: aid ? aid + 1 : 1
    })

    return () => {
      const el = { tag: props.tag ?? 'div' }
      return (
        <Transition>
          <el.tag>{slots.default?.()}</el.tag>
        </Transition>
      )
    }
  }
})

export default Animation
