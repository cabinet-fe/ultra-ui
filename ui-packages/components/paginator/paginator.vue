<template>
  <div :class="cls.b">paginator</div>
</template>

<script lang="ts" setup>
import type { PaginatorProps } from '@ui/types/components/paginator'
import { bem } from '@ui/utils'
import { useFormFallbackProps, useFormComponent } from '@ui/compositions'

defineOptions({
  name: 'Paginator'
})

const props = withDefaults(defineProps<PaginatorProps>(), {

})

const { formProps } = useFormComponent()

const {  } = useFormFallbackProps([
  formProps ?? {},
  props
])


const cls = bem('paginator')
</script>
