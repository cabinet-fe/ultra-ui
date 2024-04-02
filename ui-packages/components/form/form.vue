<template>
  <u-grid tag="form" :cols="{ xs: 1, sm: 2, xl: 3, default: 4 }" :class="cls.b">
    <UNodeRender :content="getSlotsNodes()" />
  </u-grid>
</template>

<script lang="ts" setup generic="Model extends FormModel">
import type { FormProps } from '@ui/types/components/form'
import { UGrid } from '../grid'
import {  bem } from '@ui/utils'
import { useFormComponent } from '@ui/compositions'
import { UNodeRender } from '../node-render'
import { useNodeInterceptor } from './use-node-interceptor'
import type { FormModel } from './form-model'

defineOptions({
  name: 'Form'
})

const props = defineProps<FormProps<Model>>()

const cls = bem('form')

useFormComponent(props)

const getSlotsNodes = useNodeInterceptor({ props })
</script>
