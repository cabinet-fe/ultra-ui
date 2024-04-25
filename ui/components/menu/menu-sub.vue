<template>
  <div :class="cls?.e('sub')" @click="visible = !visible">
    <div :class="cls?.em('sub', 'title')">
      <slot name="title" />
      <UIcon><ArrowUp /></UIcon>
    </div>
    <Transition name="fade">
      <div :class="cls?.em('sub', 'item')" v-if="visible">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'
import { MenuDIKey } from './di'
import { ArrowUp } from 'icon-ultra'
import { UIcon } from '../icon'

const injected = inject(MenuDIKey)
const { cls } = injected || {}

const visible = ref<boolean>(false)
</script>
