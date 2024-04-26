<template>
  <div :class="cls?.e('sub')">
    <div :class="cls?.em('sub', 'title')" @click.stop="expand = !expand">
      <UIcon
        :class="cls?.em('sub', 'arrow')"
        :style="{ transform: `rotate(${Number(expand) * 90}deg)` }"
        ><ArrowRight
      /></UIcon>
      <slot name="title" />
    </div>
    <Transition name="menu-expand">
      <div
        :class="cls?.em('sub', 'item')"
        v-show="expand"
        :style="{ maxHeight: `${Number(expand) * 1000}px` }"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, watch, onMounted } from 'vue'
import { MenuDIKey } from './di'
import { ArrowRight } from 'icon-ultra'
import { UIcon } from '../icon'
import type { MenuSubProps } from '@ui/types/components/menu'

const injected = inject(MenuDIKey)
const { cls } = injected || {}

const expand = ref<boolean>(false)

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

const open = () => (expand.value = true)

const close = () => (expand.value = false)

watch(() => injected?.openIndex.value, (index) => {
  if (index === props.index) open()
})

watch(() => injected?.closeIndex.value, (index) => {
  if (index === props.index) close()
})

onMounted(() => {
  if (injected?.expand) open()
})

defineExpose({ open, close })
</script>
