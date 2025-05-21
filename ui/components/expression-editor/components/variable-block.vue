<template>
  <span :class="cls.e('var-block')">
    <i class="icon-ultra-variable">v: </i>
    <slot />
  </span>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { ExpressionEditorDIKey } from '../di'

defineOptions({
  name: 'VariableBlock'
})

const { cls } = inject(ExpressionEditorDIKey)!
</script>
