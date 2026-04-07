<template>
  <div :class="cls.e('group')">
    <div :class="cls.e('group-title')">
      {{ title }}
    </div>

    <div :class="cls.e('group-content')">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { ThemeDIKey } from './di'

defineProps<{
  title: string
}>()

const { cls } = inject(ThemeDIKey)!
</script>
