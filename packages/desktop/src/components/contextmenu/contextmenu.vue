<template>
  <Teleport to="body">
    <transition name="zoom-in" appear @after-leave="emit('destroy')">
      <ul
        :class="[cls.b, cls.m(size)]"
        :style="style"
        v-if="visible"
        v-click-outside="handleClickOutside"
      >
        <UContextmenuItem
          v-for="menu of menus"
          :menu="menu"
          :disabled="getMenuDisabled(menu)"
          @click-start="handleClickStart"
          @click-end="handleClickEnd"
        />
      </ul>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { vClickOutside } from '@veltra/directives'
import { bem, withUnit, zIndex } from '@veltra/utils'
import { computed, provide, shallowRef, type CSSProperties } from 'vue'

import type {
  ContextmenuEmits,
  ContextmenuItem,
  ContextmenuProps,
  ComponentSize
} from '../../types'
import UContextmenuItem from './contextmenu-item.vue'
import { ContextmenuDIKey } from './di'

defineOptions({ name: 'Contextmenu' })

const props = withDefaults(defineProps<ContextmenuProps>(), { width: 150 })

const emit = defineEmits<ContextmenuEmits>()

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const cls = bem('contextmenu')

const visible = shallowRef(true)

const computePosition = () => {
  const position: {
    top?: number
    left?: number
    right?: number
    bottom?: number
    transformOrigin?: string
  } = {}

  const { mousePosition } = props
  const { x, y } = mousePosition
  if (x > window.innerWidth / 2) {
    position.right = window.innerWidth - x - 1
  } else {
    position.left = x + 1
  }
  if (y > window.innerHeight / 2) {
    position.bottom = window.innerHeight - y - 1
  } else {
    position.top = y + 1
  }

  const positionY = position.top ? 'top' : 'bottom'
  const positionX = position.left ? 'left' : 'right'
  position.transformOrigin = `${positionY} ${positionX}`

  return Object.fromEntries(
    Object.entries(position).map(([k, v]) => [k, withUnit(v as number | string | undefined, 'px')])
  ) as CSSProperties
}

const style = computed<CSSProperties>(() => {
  return { width: withUnit(props.width, 'px'), ...computePosition(), zIndex: zIndex() }
})

const menus = computed(() => {
  const { menus } = props
  if (typeof menus === 'function') {
    return menus()
  }
  return menus
})

const getMenuDisabled = (menu: ContextmenuItem) => {
  return typeof menu.disabled === 'function' ? menu.disabled() : menu.disabled
}

function close() {
  visible.value = false
}

let loading = false
function handleClickStart() {
  loading = true
}

function handleClickEnd() {
  loading = false
  close()
}

function handleClickOutside() {
  if (loading) return
  close()
}

provide(ContextmenuDIKey, { cls })
</script>
