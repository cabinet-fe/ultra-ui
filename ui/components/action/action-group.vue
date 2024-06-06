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

function open() {
  timer !== undefined && clearTimeout(timer)
  dropdownRef.value?.open({
    virtual: triggerRef.value?.el
  })
}

provide(ActionDIKey, {
  open,
  close
})

function getSlotsNodes() {
  // @ts-ignore
  const nodes = slots.default?.()?.filter(node => node.type?.name === 'Action')
  if (!nodes) return []

  const normalNodes = nodes.slice(0, props.max)
  const hiddenNodes = nodes.slice(props.max)

  const dropdown = hiddenNodes.length ? (
    <UDropdown minWidth='100px' trigger='custom' ref={dropdownRef}>
      {{
        content: () => (
          <div
            class='u-action__dropdown'
            onMouseenter={open}
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
          onMouseenter={open}
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
