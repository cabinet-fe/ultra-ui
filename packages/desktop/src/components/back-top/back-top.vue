<template>
  <Teleport to="body">
    <Transition :name="transitionName">
      <u-button
        v-if="visible"
        :class="cls.b"
        circle
        size="large"
        title="回到顶部"
        @click="scrollToTop"
      >
        <u-icon><ArrowUp /></u-icon>
      </u-button>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ArrowUp } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'

import type { BackTopEmits, BackTopProps } from '../../types'
import { UButton } from '../button'
import { UIcon } from '../icon'

defineOptions({ name: 'UBackTop' })

const props = withDefaults(defineProps<BackTopProps>(), { visibilityHeight: 400 })

const emit = defineEmits<BackTopEmits>()

const cls = bem('back-top')
const transitionName = cls.create('fade').b

const visible = shallowRef(false)

let scrollTarget: HTMLElement | Window | null = null

const resolveTarget = (): HTMLElement | Window => {
  const { target } = props

  if (!target) return window
  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(target) ?? window
  }
  return target
}

const updateVisible = () => {
  const top =
    scrollTarget === window ? window.scrollY : ((scrollTarget as HTMLElement)?.scrollTop ?? 0)

  visible.value = top >= props.visibilityHeight
}

const bind = () => {
  scrollTarget = resolveTarget()
  scrollTarget.addEventListener('scroll', updateVisible, { passive: true })
}

const unbind = () => {
  scrollTarget?.removeEventListener('scroll', updateVisible)
  scrollTarget = null
}

watch(
  () => props.target,
  () => {
    if (!scrollTarget) return

    unbind()
    bind()
    updateVisible()
  }
)

onMounted(() => {
  bind()
  updateVisible()
})

onBeforeUnmount(unbind)

const scrollToTop = () => {
  scrollTarget?.scrollTo({ top: 0, behavior: 'smooth' })
  emit('click')
}
</script>
