<template>
  <component v-for="node of getSlotsNodes()" :key="node.key" :is="node" />
</template>

<script lang="tsx" setup>
import type { ActionGroupProps } from '@ui/types/components/action'
import { ArrowDown } from 'icon-ultra'
import { UIcon } from '../icon'
import { UButton } from '../button'
import type { VNode } from 'vue'
import { bem, extractNormalVNodes } from '@ui/utils'
import { UTip } from '../tip'

defineOptions({
  name: 'ActionGroup',
  inheritAttrs: false
})

const props = withDefaults(defineProps<ActionGroupProps>(), {
  max: 3
})

const cls = bem('action-group')

const slots = defineSlots<{
  default?: () => VNode[]
}>()

function getSlotsNodes() {
  const nodes = slots.default?.()

  if (!nodes) return []
  const extractedNodes = extractNormalVNodes(nodes).filter(
    // @ts-ignore
    node => node.type?.name === 'Action'
  )

  const normalNodes = extractedNodes.slice(0, props.max - 1)
  const hiddenNodes = extractedNodes.slice(props.max - 1)

  const dropdown = hiddenNodes.length ? (
    <UTip direction='bottom' class={cls.e('dropdown')}>
      {{
        content: () => hiddenNodes,
        default: () => (
          <UButton text size='small' type='primary'>
            更多
            <UIcon>
              <ArrowDown />
            </UIcon>
          </UButton>
        )
      }}
    </UTip>
  ) : null

  return dropdown ? [...normalNodes, dropdown] : normalNodes
}
</script>
