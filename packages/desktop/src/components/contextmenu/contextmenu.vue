<template>
  <Teleport to="body">
    <transition name="zoom-in" appear @after-leave="emit('destroy')">
      <UContextmenuPanel
        v-if="visible"
        :menus="menus"
        :class="[cls.b, cls.m(size)]"
        :style="style"
        v-click-outside="handleClickOutside"
      />
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { vClickOutside } from '@veltra/directives'
import { bem, withUnit, zIndex } from '@veltra/utils'
import { computed, provide, shallowRef, type CSSProperties } from 'vue'

import type { ContextmenuEmits, ContextmenuProps, ComponentSize } from '../../types'
import UContextmenuPanel from './contextmenu-panel.vue'
import { ContextmenuRootDIKey } from './di'

defineOptions({ name: 'UContextmenu' })

const props = withDefaults(defineProps<ContextmenuProps>(), { width: 150 })

const emit = defineEmits<ContextmenuEmits>()

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const cls = bem('contextmenu')

const visible = shallowRef(true)

const style = computed<CSSProperties>(() => {
  const { x, y } = props.mousePosition
  const flipX = x > window.innerWidth / 2
  const flipY = y > window.innerHeight / 2
  return {
    width: withUnit(props.width, 'px'),
    zIndex: zIndex(),
    ...(flipX
      ? { right: withUnit(window.innerWidth - x - 1, 'px') }
      : { left: withUnit(x + 1, 'px') }),
    ...(flipY
      ? { bottom: withUnit(window.innerHeight - y - 1, 'px') }
      : { top: withUnit(y + 1, 'px') }),
    transformOrigin: `${flipY ? 'bottom' : 'top'} ${flipX ? 'right' : 'left'}`
  }
})

const menus = computed(() => (typeof props.menus === 'function' ? props.menus() : props.menus))

function close() {
  visible.value = false
}

let loading = false

provide(ContextmenuRootDIKey, {
  cls,
  onItemClickStart: () => {
    loading = true
  },
  onItemClickEnd: () => {
    loading = false
    close()
  }
})

function handleClickOutside() {
  if (loading) return
  close()
}
</script>
