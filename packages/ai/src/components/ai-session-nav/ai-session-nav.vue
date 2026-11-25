<template>
  <div v-if="items.length >= minItems && scrollable" :class="cls.b">
    <div
      v-for="item in items"
      :key="item.key"
      :class="cls.e('item')"
      @mouseenter="hoveredKey = item.key"
      @mouseleave="hoveredKey === item.key && (hoveredKey = undefined)"
    >
      <button
        type="button"
        :class="[
          cls.e('dot'),
          bem.is('active', item.key === activeKey),
          bem.is('read', item.index < activeIndex)
        ]"
        :aria-label="`第 ${item.index + 1} 轮：${item.question}`"
        @focus="hoveredKey = item.key"
        @blur="hoveredKey === item.key && (hoveredKey = undefined)"
        @click="emit('jump', item.key)"
      />

      <div v-if="hoveredKey === item.key" :class="cls.e('tooltip')">
        <div :class="cls.e('tooltip-row')">
          <span :class="cls.e('tooltip-label')">问</span>
          <span :class="cls.e('tooltip-q')">{{ item.question }}</span>
        </div>
        <div v-if="item.answer" :class="cls.e('tooltip-row')">
          <span :class="cls.e('tooltip-label')">答</span>
          <span :class="cls.e('tooltip-a')">{{ item.answer }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import './style'
import { bem } from '@veltra/utils'
import { computed, ref } from 'vue'

import type { AiSessionNavEmits, AiSessionNavProps } from '../../types'

defineOptions({ name: 'UAiSessionNav' })

const props = withDefaults(defineProps<AiSessionNavProps>(), { scrollable: true, minItems: 3 })

const emit = defineEmits<AiSessionNavEmits>()

const cls = bem('ai-session-nav')

const hoveredKey = ref<string>()

const activeIndex = computed(() => props.items.findIndex((item) => item.key === props.activeKey))
</script>
