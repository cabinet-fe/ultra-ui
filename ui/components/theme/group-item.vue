<template>
  <div :class="cls.e('group-item')">
    <label :class="cls.e('group-label')">
      {{ label }}
    </label>

    <div :class="cls.e('group-item-content')">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { ThemeDIKey } from './di'

defineProps<{
  label: string
}>()

const { cls } = inject(ThemeDIKey)!
</script>
