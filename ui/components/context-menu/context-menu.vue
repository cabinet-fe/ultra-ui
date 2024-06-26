<template>
  <transition name="zoom-in" appear @after-leave="emit('destroy')">
    <ul
      :class="[cls.b, cls.m(size)]"
      :style="style"
      ref="contextMenuRef"
      v-if="visible"
      v-click-outside="handleClickOutside"
    >
      <UContextMenuItem
        v-for="menu of menus"
        :menu="menu"
        :disabled="getMenuDisabled(menu)"
        @click-start="handleClickStart"
        @click-end="handleClickEnd"
      />
    </ul>
  </transition>
</template>

<script lang="ts" setup>
import type {
  ContextMenuEmits,
  ContextMenuItem,
  ContextMenuProps
} from '@ui/types/components/context-menu'
import { bem, withUnit, zIndex } from '@ui/utils'
import { computed, provide, shallowRef, type CSSProperties } from 'vue'
import { ContextMenuDIKey } from './di'
import UContextMenuItem from './context-menu-item.vue'
import { objMap } from 'cat-kit/fe'
import { useFallbackProps } from '@ui/compositions'
import type { ComponentSize } from '@ui/types/component-common'
import { vClickOutside } from '@ui/directives'

defineOptions({
  name: 'ContextMenu'
})

const props = withDefaults(defineProps<ContextMenuProps>(), {
  width: 150
})

const emit = defineEmits<ContextMenuEmits>()

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const cls = bem('context-menu')

const contextMenuRef = shallowRef<HTMLElement>()

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

  return objMap(position, v => withUnit(v, 'px'))
}

const style = computed<CSSProperties>(() => {
  return {
    width: withUnit(props.width, 'px'),
    ...computePosition(),
    zIndex: zIndex()
  }
})

const menus = computed(() => {
  const { menus } = props
  if (typeof menus === 'function') {
    return menus()
  }
  return menus
})

const getMenuDisabled = (menu: ContextMenuItem) => {
  return typeof menu.disabled === 'function' ? menu.disabled() : menu.disabled
}

function close() {
  visible.value = false
}


let loading = false
function handleClickStart() {
  loading= true
}

function handleClickEnd() {
  loading = false
  close()
}


function handleClickOutside() {
  if (loading) return
  close()
}


provide(ContextMenuDIKey, {
  cls
})
</script>
