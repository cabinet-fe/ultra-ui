<template>
  <u-tip
    :class="cls.b"
    :trigger="trigger"
    :direction="direction"
    :alignment="alignment"
    :content-tag="contentTag"
    v-model:visible="visible"
  >
    <slot name="reference" />

    <template #content>
      <div :class="[cls.m('main'), cls.m(size)]">
        <u-icon :size="16" :class="cls.m('icon')" :style="{ color: iconColor }">
          <component :is="icon" />
        </u-icon>
        <span>
          {{ title }}
        </span>
      </div>
      <div :class="cls.m('action')">
        <u-button size="small" @click="cancel" type="primary" text>
          {{ cancelText }}
        </u-button>
        &nbsp;
        <u-button size="small" type="primary" @click="confirm">
          {{ confirmText }}
        </u-button>
      </div>
    </template>
  </u-tip>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { QuestionFilled } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { ref } from 'vue'

import type { PopConfirmProps, PopConfirmEmits } from '../../types'
import { UButton } from '../button'
import { UIcon } from '../icon'
import { UTip } from '../tip'

defineOptions({ name: 'PopConfirm' })

const emit = defineEmits<PopConfirmEmits>()

withDefaults(defineProps<PopConfirmProps>(), {
  trigger: 'click',
  icon: QuestionFilled,
  direction: 'bottom',
  iconColor: '#ffc107',
  confirmText: '确认',
  cancelText: '取消'
})

const cls = bem('pop-confirm')

const visible = ref(false)

const { formProps } = injectFormContext()

const { size } = useFormFallbackProps([formProps ?? {}], { size: 'default' })

const confirm = () => {
  emit('confirm')
  visible.value = false
}

const cancel = () => {
  emit('cancel')
  visible.value = false
}
</script>
