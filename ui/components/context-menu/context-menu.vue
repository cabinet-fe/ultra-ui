<template>
  <transition name="fade" appear @after-leave="emit('destroy')">
    <ul
      :class="[cls.b, cls.m(size)]"
      :style="style"
      ref="contextMenuRef"
      v-if="visible"
    >
      <UContextMenuItem
        v-for="menu of menus"
        :menu="menu"
        :disabled="getMenuDisabled(menu)"
        @click="handleClickMenu"
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
  } = {}

  const { mousePosition } = props
  const { x, y } = mousePosition
  if (x > window.innerWidth / 2) {
    position.right = window.innerWidth - x
  } else {
    position.left = x
  }
  if (y > window.innerHeight / 2) {
    position.bottom = window.innerHeight - y
  } else {
    position.top = y
  }
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

const handleClickMenu = async (menu: ContextMenuItem) => {
  if (getMenuDisabled(menu)) return
  await menu.callback?.()
  visible.value = false
}

provide(ContextMenuDIKey, {
  cls
})
</script>
