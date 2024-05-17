<template>
  <u-tip
    v-if="injected?.simple.value && textIndent === '0px'"
    position="right-start"
    :customStyle="disabled ? {} : { backgroundColor: injected?.backgroundColor }"
  >
    <div :class="[cls?.e('sub'), bem.is('disabled', disabled)]">
      <div
        :class="[cls?.em('sub', 'title'), bem.is('active', highlight)]"
        :style="{ textIndent, color: customColor }"
        v-ripple="!disabled"
      >
        <UIcon :class="cls?.em('sub', 'icon')" style="margin-right: 0" v-if="icon">
          <component :is="icon" />
        </UIcon>
      </div>
    </div>
    <template #content>
      <slot name="title" v-if="disabled" />
      <slot v-else />
    </template>
  </u-tip>

  <div
    v-else
    :class="[cls?.e('sub'), bem.is('disabled', disabled), cls?.m(size)]"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"
  >
    <div
      :class="[cls?.em('sub', 'title')]"
      @click.stop="handleClick"
      :style="{
        textIndent: injected?.simple.value ? `${parseInt(textIndent) - 40}px` : textIndent,
        paddingRight: '35px',
        color: props.disabled ? 'var(--text-color-disabled)' : injected?.textColor
      }"
      v-ripple="!disabled"
    >
      <UIcon :class="cls?.em('sub', 'icon')" v-if="icon">
        <component :is="icon" />
      </UIcon>

      <slot name="title" />
      <UIcon
        :class="cls?.em('sub', 'arrow')"
        :style="{ transform: `rotate(${Number(expand) * 90}deg)` }"
        ><ArrowRight
      /></UIcon>
    </div>
    <Transition name="menu-sub-expand">
      <div
        :class="cls?.em('sub', 'item')"
        v-show="expand"
        :style="{
          maxHeight: `${Number(expand) * 1080}px`
        }"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, watch, onMounted, getCurrentInstance, computed } from 'vue'
import { MenuDIKey, calcIndent, getSiblings } from './di'
import { ArrowRight } from 'icon-ultra'
import { UIcon } from '../icon'
import type { MenuSubProps } from '@ui/types/components/menu'
import { bem } from '@ui/utils'
import { UTip } from '../tip'
import { useFallbackProps } from '@ui/compositions'
import { vRipple } from '@ui/directives'

defineOptions({
  name: 'MenuSub'
})

const injected = inject(MenuDIKey)
const { cls } = injected || {}

const expand = ref<boolean>(false)
// emit事件
watch(
  () => expand.value,
  (val) => {
    if (val) {
      injected?.menuEmit('open', props.index || '')
    } else {
      injected?.menuEmit('close', props.index || '')
    }
  }
)

const props = defineProps<MenuSubProps>()

const { size } = useFallbackProps([props], {
  size: 'default'
})

const instance = getCurrentInstance()

const open = () => {
  expand.value = true
}

const close = () => (expand.value = false)
// 根据openIndex展开子菜单
watch(
  () => injected?.openIndex.value,
  (index) => {
    if (index === props.index) open()
  }
)
// 根据closeIndex关闭子菜单
watch(
  () => injected?.closeIndex.value,
  (index) => {
    console.log(index, props.index)
    if (index === props.index) close()
  }
)

// 缩略模式关闭子菜单
watch(
  () => injected?.simple.value,
  (val) => {
    if (val) {
      close()
      highlight.value =
        injected?.structure.value[props.index]?.has(injected!.activeIndex.value) || false
    } else {
      if (injected?.structure.value[props.index]?.has(injected!.activeIndex.value))
        expand.value = true
    }
  }
)

const handleClick = () => {
  if (props.disabled) return
  expand.value = !expand.value
}

const mouseenter = () => {
  if (injected?.simple.value) expand.value = true
}

const mouseleave = () => {
  if (injected?.simple.value) expand.value = false
}

const siblings = ref<Array<string>>([])

// 根据activeIndex展开子菜单
watch([() => injected?.activeIndex.value, injected?.structure.value], ([index, structure]) => {
  if (
    !expand.value &&
    index &&
    structure &&
    structure[props.index] &&
    structure[props.index].has(index)
  ) {
    expand.value = true
  }
})
// 根据uniqueOpened，关闭其他菜单
const highlight = ref<boolean>(false)
watch(
  () => injected?.activeIndex.value,
  (index) => {
    if (index) {
      if (injected?.uniqueOpened && index !== props.index && siblings.value.includes(index)) {
        close()
      }
      if (injected?.simple.value) {
        highlight.value = injected?.structure.value[props.index]?.has(index) || false
      }
    }
  },
  { immediate: true }
)
// 默认展开
onMounted(() => {
  if (injected?.expand) open()
})

const textIndent = ref<string>('0px')

// 根据嵌套层级计算缩进
watch(
  () => instance,
  () => {
    if (instance) {
      textIndent.value = calcIndent(instance)
      siblings.value = getSiblings(instance)
      if (injected && injected?.structure.value[props.index]?.has(injected!.activeIndex.value))
        expand.value = true
    }
  },
  { immediate: true }
)

// 用户自定义颜色
const customColor = computed(() => {
  if (!props.disabled) {
    return highlight.value ? injected?.activeTextColor : injected?.textColor
  } else {
    return 'var(--text-color-disabled)'
  }
})
defineExpose({ open, close })
</script>
