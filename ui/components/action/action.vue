<template>
  <u-pop-confirm
    v-if="needConfirm"
    title="确认执行此操作吗？"
    @confirm="handleConfirm"
    style="display: inline-block"
  >
    <template #reference>
      <u-button :class="cls.b" v-bind="props"><slot /></u-button>
    </template>
  </u-pop-confirm>

  <u-button v-else :class="cls.b" v-bind="props" @click="emit('run')">
    <slot />
  </u-button>
</template>

<script lang="ts" setup>
import type { ActionEmits, ActionProps } from '@ui/types/components/action'
import { bem } from '@ui/utils'
import { UButton } from '../button'
import { inject } from 'vue'
import { ActionDIKey } from './di'

defineOptions({
  name: 'Action'
})

const props = withDefaults(defineProps<ActionProps>(), {
  size: 'small',
  text: true,
  type: 'primary',
  inDropdown: false
})

const emit = defineEmits<ActionEmits>()

const cls = bem('action')

function handleConfirm() {
  emit('run')
  close()
}

const { close } = inject(ActionDIKey)!
</script>
