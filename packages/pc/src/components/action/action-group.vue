<script lang="tsx">
import type { ActionGroupProps } from '@ultra-ui/pc/types'
import { ArrowDown } from '@lucide/vue'
import { UIcon } from '../icon'
import { UButton } from '../button'
import { cloneVNode, defineComponent, provide, useSlots } from 'vue'
import { bem, extractNormalVNodes } from '@ultra-ui/core'
import { UTip } from '../tip'
import { ActionDIKey } from './di'

export default defineComponent({
  name: 'ActionGroup',
  inheritAttrs: false,
  props: {
    max: { type: Number, default: 3 },
    loading: { type: Boolean, default: false },
    circle: { type: Boolean, default: false }
  },
  setup(props: ActionGroupProps) {
    const cls = bem('action-group')
    const actionCls = bem('action')
    const slots = useSlots()

    provide(ActionDIKey, {
      groupProps: props
    })

    return () => {
      const nodes = slots.default?.() ?? []
      const extractedNodes = extractNormalVNodes(nodes).filter(node => {
        const t = node.type as { name?: string } | string | undefined
        return typeof t === 'object' && t?.name === 'Action'
      })

      let normalNodes: (typeof extractedNodes)[number][] = []
      let hiddenNodes: (typeof extractedNodes)[number][] = []
      if (extractedNodes.length === props.max) {
        normalNodes = extractedNodes
      } else {
        normalNodes = extractedNodes.slice(0, props.max - 1)
        hiddenNodes = extractedNodes.slice(props.max - 1)
      }

      const dropdown = hiddenNodes.length ? (
        <UTip direction="bottom" class={cls.e('dropdown')}>
          {{
            content: () => hiddenNodes,
            default: () => (
              <UButton text size="small" type="primary" class={actionCls.b}>
                更多
                <UIcon>
                  <ArrowDown />
                </UIcon>
              </UButton>
            )
          }}
        </UTip>
      ) : null

      const clonedNormal = normalNodes.map(n => cloneVNode(n))
      return dropdown ? [...clonedNormal, dropdown] : clonedNormal
    }
  }
})
</script>
