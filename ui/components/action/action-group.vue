<template>
  <component v-for="node of getSlotsNodes()" :key="node.key" :is="node" />
</template>

<script lang="tsx" setup>
import type { ActionGroupProps } from '@ui/types/components/action'
import { UDropdown, type DropdownExposed } from '../dropdown'
import { ArrowDown } from 'icon-ultra'
import { UIcon } from '../icon'
import { UButton, type ButtonExposed } from '../button'
import { provide, shallowRef, type VNode } from 'vue'
import { ActionDIKey } from './di'
import { extractNormalVNodes } from '@ui/utils'

defineOptions({
  name: 'ActionGroup',
  inheritAttrs: false
})

const props = withDefaults(defineProps<ActionGroupProps>(), {
  max: 3
})

const slots = defineSlots<{
  default?: () => VNode[]
}>()

const dropdownRef = shallowRef<DropdownExposed>()
const triggerRef = shallowRef<ButtonExposed>()

let timer: undefined | number

function close() {
  timer = setTimeout(() => {
    dropdownRef.value?.close()
  }, 200)
}

function stopClose() {
  timer !== undefined && clearTimeout(timer)
}

function open() {
  dropdownRef.value?.open({
    virtual: triggerRef.value?.el
  })
}

function handleMouseEnter() {
  stopClose()
  open()
}

provide(ActionDIKey, {
  open,
  close,
  stopClose
})

function getSlotsNodes() {
  const nodes = slots.default?.()

  if (!nodes) return []
  const extractedNodes = extractNormalVNodes(nodes).filter(
    // @ts-ignore
    node => node.type?.name === 'Action'
  )

  const normalNodes = extractedNodes.slice(0, props.max)
  const hiddenNodes = extractedNodes.slice(props.max)

  const dropdown = hiddenNodes.length ? (
    <UDropdown minWidth='100px' trigger='custom' ref={dropdownRef}>
      {{
        content: () => (
          <div
            class='u-action__dropdown'
            onMouseenter={stopClose}
            onMouseleave={close}
          >
            {hiddenNodes}
          </div>
        )
      }}
    </UDropdown>
  ) : null

  return dropdown
    ? [
        ...normalNodes,
        <UButton
          text
          size='small'
          type='primary'
          ref={triggerRef}
          onMouseenter={handleMouseEnter}
          onMouseleave={close}
        >
          更多
          <UIcon>
            <ArrowDown />
          </UIcon>{' '}
        </UButton>,
        dropdown
      ]
    : normalNodes
}
</script>
