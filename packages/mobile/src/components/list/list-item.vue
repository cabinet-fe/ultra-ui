<template>
  <li :class="itemClass">
    <slot />
  </li>
</template>

<script lang="ts" setup>
import { computed, useAttrs } from 'vue'

import { bem } from '../../shared/bem'

defineOptions({ name: 'UListItem' })

const cls = bem('list-item')

// 绑定了点击监听（如 @click）即视为可点行：加按压态反馈，点击由 attrs 透传到 li
const attrs = useAttrs()

const itemClass = computed(() => [cls.b, bem.is('clickable', 'onClick' in attrs)])
</script>
