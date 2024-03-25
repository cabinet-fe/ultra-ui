<template>
  <div :class="classList">
    <!-- <div :class="[cls.b, type ? cls.e(type) : '', size ? cls.e(size) : '', classRound]"> -->
    <div :class="cls.e('content')">
      <slot />
      <u-button circle size="small" text :type="type" v-if="closable" @click.prevent="handleClose">
        x
        <!-- <u-icon name="close" /> -->
      </u-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TagEmits, TagProps } from '@ui/types/components/tag'
import { bem } from '@ui/utils'
import { UButton } from '../button'
import { computed } from 'vue'

defineOptions({
  name: 'Tag'
})

const cls = bem('tag')

const props = withDefaults(defineProps<TagProps>(), {})

const emits = defineEmits<TagEmits>()

const handleClose = () => {
  emits('close')
}

const classList = computed(() => {
  return [
    cls.b,
    props.type ? cls.e(props.type) : '',
    props.size ? cls.m(props.size) : '',
    props.round ? bem.is('round') : ''
  ]
})

// const classRound = computed(() => {
//   return [bem.is('round', props.round)]
// })
</script>
