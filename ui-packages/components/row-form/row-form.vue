<template>
  <div :class="cls.b">

  </div>
</template>

<script lang="ts" setup>
import type { RowFormProps } from '@ui/types/components/row-form'
import { bem } from '@ui/utils'

defineOptions({
  name: 'RowForm'
})

defineProps<RowFormProps>()

const cls = bem('row-form')
</script>
