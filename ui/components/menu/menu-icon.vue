<template>
  <template v-if="icon">
    <u-icon :class="cls.e('sub-icon')" v-if="typeof icon !== 'string'">
      <component :is="icon" />
    </u-icon>

    <img :src="icon" v-else :class="cls?.e('sub-icon')" alt="icon" />
  </template>
</template>

<script lang="ts" setup>
import { inject, type DefineComponent } from 'vue'
import { MenuDIKey } from './di'
import { UIcon } from '../icon'

defineOptions({
  name: 'MenuIcon'
})

defineProps<{
  icon?: string | DefineComponent
}>()

const { cls } = inject(MenuDIKey)!
</script>
