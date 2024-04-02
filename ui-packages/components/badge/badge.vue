<template>
  <div :class="cls.b">
    <slot />
    <span>{{ value }}</span>
  </div>
</template>

<script lang="ts" setup>
import type {BadgeProps} from "@ui/types/components/badge"
import {bem} from "@ui/utils"

defineOptions({
  name: "Badge",
})

withDefaults(defineProps<BadgeProps>(), {})

const cls = bem("badge")
</script>
