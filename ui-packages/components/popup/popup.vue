<template>
  <UNodeRender :content="renderTrigger()" @click="pop" />

  <Teleport to="body">
    <section
      v-if="visible"
      :class="className"
      :style="{
        zIndex: zIndex()
      }"
    >
      <slot />
    </section>
  </Teleport>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, Text, computed, VNode, shallowRef } from 'vue'
import { PopupProps } from './popup.type'
import { bem, zIndex } from '@ui/utils'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'UPopup'
})

const props = defineProps<PopupProps>()

// const emit = defineEmits()

const visible = shallowRef(false)

const cls = bem('popup')

const slots = defineSlots<{
  trigger?(): VNode[] | undefined
}>()

const className = computed(() => {
  return [cls.b]
})

const renderTrigger = () => {
  const nodes = slots.trigger?.()
  return nodes?.filter(node => node.type !== Text)?.[0]
}

// const hide = () => {
//   visible.value = false
// }

const pop = () => {
  visible.value = !visible.value

  // const { context } = props
  // if (!context) return

  // context.instances[context.activeUid]?.hide()

  // const uid = context.uid++
  // context.instances[uid] = {
  //   hide
  // }
  // context.activeUid = uid

  // console.log(context)
}

onBeforeUnmount(() => {
  props
})

defineExpose({
  zIndex
})
</script>
