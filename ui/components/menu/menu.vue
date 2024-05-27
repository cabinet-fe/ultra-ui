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

defineOptions({
  name: 'Menu'
})

const props = defineProps<MenuProps>()

const emit = defineEmits<MenuEmits>()

const cls = bem('menu')

const {
  size,
  expand,
  activeIndex,
  simple,
  router,
  textColor,
  backgroundColor,
  activeTextColor,
  uniqueOpened
} = useFallbackProps([props], {
  size: 'default',
  expand: false,
  activeIndex: '',
  simple: false,
  router: false,
  activeTextColor: '',
  textColor: '',
  backgroundColor: '#fff',
  uniqueOpened: false
})

const store = <MenuContext>({
  cls,
  menuProps: props,
  menuEmit: emit,
  openIndex: ref(''),
  closeIndex: ref(''),
  expand: expand.value,
  activeIndex: ref(activeIndex.value),
  simple: ref(simple.value),
  router: router.value,
  textColor: textColor.value,
  activeTextColor: activeTextColor.value,
  backgroundColor: backgroundColor.value,
  uniqueOpened: uniqueOpened.value,
  structure: ref({})
})
// 剔除动画完成时间
watch(
  () => simple.value,
  (val) => {
    if (val) {
      setTimeout(() => (store.simple.value = true), 550)
    } else {
      setTimeout(() => (store.simple.value = false), 150)
    }
  }
)

watch(() => activeIndex.value, (index) => {
  store.activeIndex.value = index
})

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
  if (simple.value) {
    return { small: '50px', default: '66px', large: '90px' }[size.value]
  } else {
    return '1980px'
  }
})

defineExpose({ open, close })
</script>
