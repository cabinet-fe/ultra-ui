<template>
  <transition name="fade">
    <div :class="[cls.b, cls.m(size), cls.e(type)]" v-show="visible">
      <!-- <div :class="cls.e('icon')"></div> -->
      <div :class="cls.e('message')">{{ message }}</div>
      <div :class="cls.e('close')" v-if="closable" @click="close">
        <UIcon><Close /></UIcon>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import type { MessageProps, MessageExposed } from '@ui/types/components/message'
import { bem } from '@ui/utils'
import { reactive, onMounted, ref } from 'vue'
import { useFallbackProps } from '@ui/compositions'
import { Close } from 'icon-ultra'
import { UIcon } from '../icon'

defineOptions({
  name: 'Message'
})

const props = defineProps<MessageProps>()

const { type, size, closable } = useFallbackProps([props], {
  type: 'primary',
  size: 'default',
  closable: true
})

const cls = bem('message')

const visible = ref<boolean>(false)

onMounted(() => {
  visible.value = true
})

const close = () => {
  visible.value = false
}

defineExpose<MessageExposed>({ })
</script>
