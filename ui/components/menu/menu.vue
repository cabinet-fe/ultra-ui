<template>
  <div
    :class="[cls.b, cls.m(size), bem.is('simple', simple)]"
    :style="{ maxWidth, backgroundColor }"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import type { MenuEmits, MenuProps } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import { provide, ref, watch, computed } from 'vue'
import { MenuDIKey, type MenuContext } from './di'
import { useFallbackProps } from '@ui/compositions'
import type { ComponentSize } from '@ui/types/component-common'

defineOptions({
  name: 'Menu'
})

const props = withDefaults(defineProps<MenuProps>(), {
  expand: false,
  activeIndex: '',
  simple: false,
  router: false,
  activeTextColor: '',
  textColor: '',
  backgroundColor: '#fff',
  uniqueOpened: false
})

const emit = defineEmits<MenuEmits>()

const cls = bem('menu')

const { size } = useFallbackProps([props], {
  size: 'default' as ComponentSize
})

const store = <MenuContext>{
  cls,
  menuProps: props,
  menuEmit: emit,
  openIndex: ref(''),
  closeIndex: ref(''),
  expand: props.expand,
  activeIndex: ref(props.activeIndex),
  simple: ref(props.simple),
  router: props.router,
  textColor: props.textColor,
  activeTextColor: props.activeTextColor,
  backgroundColor: props.backgroundColor,
  uniqueOpened: props.uniqueOpened,
  structure: ref({})
}
// 剔除动画完成时间
watch(
  () => props.simple,
  (val) => {
    if (val) {
      setTimeout(() => (store.simple.value = true), 550)
    } else {
      setTimeout(() => (store.simple.value = false), 150)
    }
  }
)

watch(
  () => props.activeIndex,
  (index) => {
    store.activeIndex.value = index
  }
)

provide(MenuDIKey, store)
/** 给用户提供的展开方法 */
const open = (index: string) => {
  store.openIndex.value = index
  if (store.closeIndex.value === index) store.closeIndex.value = ''
}
/** 给用户提供的关闭方法 */
const close = (index: string) => {
  store.closeIndex.value = index
  if (store.openIndex.value === index) store.openIndex.value = ''
}
// 切换缩略模式的最大宽度
const maxWidth = computed(() => {
  if (props.simple) {
    return { small: '50px', default: '66px', large: '90px' }[size.value]
  } else {
    return '1980px'
  }
})

defineExpose({ open, close })
</script>
