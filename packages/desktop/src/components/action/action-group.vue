<template>
  <component v-for="node of getSlotsNodes()" :key="node.key" :is="node" />
</template>

<script lang="tsx" setup>
import { MoreFilled } from '@veltra/icons/normal'
import { bem, extractNormalVNodes } from '@veltra/utils'
import { cloneVNode, provide, shallowRef, type VNode } from 'vue'

import type { _ActionGroupExposed, ActionGroupProps } from '../../types'
import { UButton } from '../button'
import { UTip } from '../tip'
import { ActionDIKey } from './di'

defineOptions({
  name: 'UActionGroup',
  inheritAttrs: false
})

const props = withDefaults(defineProps<ActionGroupProps>(), {
  max: 3,
  loading: false,
  circle: false,
  size: 'small',
  text: true,
  type: 'primary'
})

const cls = bem('action-group')

const slots = defineSlots<{
  default?: () => VNode[]
}>()

function isInDropdownNode(node: VNode): boolean {
  const p = node.props as Record<string, unknown> | null
  if (!p) return false
  const v = p.inDropdown ?? p['in-dropdown']
  return v === true || v === '' || v === 'true'
}

const tipVisible = shallowRef(false)

function closeTip() {
  tipVisible.value = false
}

function withSeparators(nodes: VNode[]) {
  return nodes.flatMap((node, index) => {
    if (index === 0) return [node]

    return [
      <i
        key={`separator-${index}`}
        class={cls.e('separator')}
        aria-hidden="true"
      />,
      node
    ]
  })
}

function getSlotsNodes() {
  const nodes = slots.default?.()
  if (!nodes) return []

  const extracted = extractNormalVNodes(nodes).filter(
    (node) => (node.type as { name?: string } | null | undefined)?.name === 'Action'
  )

  const visible: VNode[] = []
  const fixedHidden: VNode[] = []

  extracted.forEach((node) => {
    if (isInDropdownNode(node)) {
      fixedHidden.push(node)
    } else {
      visible.push(node)
    }
  })

  const willOverflow = visible.length > props.max
  const overflow = willOverflow ? visible.splice(props.max - 1) : []

  const hiddenNodes = [...overflow, ...fixedHidden]

  const dropdownNodes = hiddenNodes.map((node) =>
    cloneVNode(node, { inDropdown: true, circle: false })
  )

  const dropdown = hiddenNodes.length ? (
    <UTip
      direction="bottom"
      alignment="end"
      trigger="click"
      class={cls.e('dropdown')}
      visible={tipVisible.value}
      onUpdate:visible={(val: boolean) => {
        tipVisible.value = val
      }}
    >
      {{
        content: () => dropdownNodes,
        default: () => (
          <UButton
            class={cls.e('more')}
            type={props.type}
            size={props.size}
            text={props.text}
            circle
            icon={MoreFilled}
          />
        )
      }}
    </UTip>
  ) : null

  return withSeparators(dropdown ? [...visible, dropdown] : visible)
}

provide(ActionDIKey, {
  groupProps: props,
  closeTip
})

defineExpose<_ActionGroupExposed>({
  closeTip
})
</script>
