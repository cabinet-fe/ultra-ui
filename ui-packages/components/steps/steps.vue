<template>
  <ol :class="[cls.b, bem.is('vertical', mode === 'vertical')]">
    <li
      :class="[cls.e('step'), bem.is('vertical', mode === 'vertical')]"
      v-for="(item, index) in items"
      @click="selectStep(item.key)"
    >
      <div
        :class="[
          cls.e('index'),
          bem.is('active', active === item.key),
          bem.is('vertical', mode === 'vertical')
        ]"
      >
        <div :class="cls.em('index', 'line')" v-if="index !== 0"></div>
        <div :class="cls.em('index', 'placeholder')" v-else></div>
        <div :class="[cls.em('index', 'number'), bem.is('active', active === item.key)]">
          {{ index + 1 }}
        </div>
        <div :class="cls.em('index', 'line')" v-if="index !== items.length - 1"></div>
        <div :class="cls.em('index', 'placeholder')" v-else></div>
      </div>
      <div :class="[cls.e('content'), bem.is('active', active === item.key)]">
        {{ item.label }}
      </div>
    </li>
  </ol>
</template>

<script lang="ts" setup>
import type { StepsProps, StepsEmits } from '@ui/types/components/steps'
import { bem } from '@ui/utils'
import { useFormFallbackProps, useFormComponent } from '@ui/compositions'

defineOptions({
  name: 'Steps'
})

const props = withDefaults(defineProps<StepsProps>(), {
  mode: 'horizontal'
})

const emit = defineEmits<StepsEmits>()

const { formProps } = useFormComponent()

const {} = useFormFallbackProps([formProps ?? {}, props])

const cls = bem('steps')

const selectStep = (key: string) => {
  emit('update:active', key)
}
</script>
