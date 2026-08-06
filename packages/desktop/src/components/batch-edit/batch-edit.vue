<template>
  <u-layout
    :class="cls.b"
    :cols="cols"
    rows="minmax(0, 1fr) "
    gap="8px"
    resizable
    tabindex="-1"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
    @keydown.capture="handleKeydown"
  >
    <!-- 编辑列表 -->
    <BatchEditList :slots="slots" />

    <!-- 编辑表单 -->
    <BatchEditForm ref="form" v-slot="scoped">
      <slot name="form" v-bind="scoped" />
    </BatchEditForm>
  </u-layout>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, provide, useTemplateRef } from 'vue'

import type { BatchEditEmits, BatchEditProps, BatchEditSlots, FormExposed } from '../../types'
import { ULayout } from '../layout'
import BatchEditForm from './batch-edit-form.vue'
import BatchEditList from './batch-edit-list.vue'
import { BatchEditDIKey } from './di'
import { useEditState } from './use-edit-state'
import { useFeatures } from './use-features'
import { useHandlers } from './use-handlers'
import { useShortcutKey } from './use-shortcut-key'

defineOptions({ name: 'UBatchEdit' })

const props = withDefaults(defineProps<BatchEditProps>(), { cols: () => ['1fr', '420px'] })

const emit = defineEmits<BatchEditEmits>()

const slots = defineSlots<BatchEditSlots>()

const cls = bem('batch-edit')

const formRef = useTemplateRef<FormExposed>('form')

const { state, resetState, syncing } = useEditState({ props, formRef })

const { staticFeatures, dynamicFeatures } = useFeatures({ props })

const handlers = useHandlers({ props, emit, state, resetState, formRef })

// 快捷键处理
const { handleFocusIn, handleFocusOut, handleKeydown, focused } = useShortcutKey({
  props,
  onSave: handlers.handleSave,
  onClose: handlers.handleClose,
  state
})

const cols = computed(() => {
  return state.formVisible ? props.cols : undefined
})

provide(BatchEditDIKey, {
  cls,
  props,
  emit,
  state,
  staticFeatures,
  dynamicFeatures,
  focused,
  syncing,
  ...handlers
})
</script>
