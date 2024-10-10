<template>
  <span :class="className">
    <span :class="cls.e('content')">
      <slot />
    </span>

    <u-icon
      v-if="closable"
      @click.stop="handleClose"
      :class="cls.e('icon-close')"
    >
      <Close />
    </u-icon>
  </span>
</template>

<script lang="ts" setup>
import type { TagEmits, TagProps } from '@ui/types/components/tag'
import { bem } from '@ui/utils'
import { computed } from 'vue'
import { UIcon } from '../icon'
import { Close } from 'icon-ultra'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'

defineOptions({
  name: 'Tag'
})

const cls = bem('tag')

const props = withDefaults(defineProps<TagProps>(), {})

const emit = defineEmits<TagEmits>()

const { formProps } = useFormComponent()
const { size } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default'
})

const handleClose = () => {
  emit('close')
}

const className = computed(() => {
  const { type } = props
  return [
    cls.b,
    cls.m(size.value),
    type && cls.m('color-' + type),
    bem.is('round', props.round),
    bem.is('dark', props.dark)
  ]
})

// const classRound = computed(() => {
//   return [bem.is('round', props.round)]
// })
</script>
