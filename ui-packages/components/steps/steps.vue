<template>
  <ol v-if="mode ==='vertical'" :class="[cls.b, bem.is('vertical', mode === 'vertical')]">
    <li
      :class="[
        cls.e('step'),
        bem.is('vertical', mode === 'vertical'),
        bem.is('readonly', readonly)
      ]"
      v-for="(item, index) in items"
      @click="selectStep(item.key)"
    >
      <div
        :class="[
          cls.e('icon'),
          bem.is('active', active === item.key),
          bem.is('vertical', mode === 'vertical')
        ]"
      >
        <div :class="cls.em('icon', 'line')" v-if="index !== 0"></div>
        <div :class="cls.em('icon', 'placeholder')" v-else></div>
        <slot :name="`${item.key}-icon`" :data="item">
          <div :class="[cls.em('icon', 'number'), bem.is('active', active === item.key)]">
            {{ index + 1 }}
          </div>
        </slot>
        <div :class="cls.em('icon', 'line')" v-if="index !== items.length - 1"></div>
        <div :class="cls.em('icon', 'placeholder')" v-else></div>
      </div>

      <div :class="[cls.e('description'), bem.is('active', active === item.key)]">
        <slot :name="`${item.key}-desc`" :data="item">
          {{ item.label }}
        </slot>
      </div>
    </li>
  </ol>

  <ol v-else>

  </ol>
</template>

<script lang="ts" setup>
import type { StepsProps, StepsEmits } from '@ui/types/components/steps'
import { bem } from '@ui/utils'
import { useFormFallbackProps, useFormComponent } from '@ui/compositions'

defineOptions({
  name: 'Steps'
})

// todo: 优化
// 1. 增加泛型提示
// 2. 优化Slots
// 3. mode -> direction
// 4. 优化方向渲染的优先级逻辑

const props = withDefaults(defineProps<StepsProps>(), {
  mode: 'horizontal',
  readonly: undefined
})

const emit = defineEmits<StepsEmits>()

const { formProps } = useFormComponent()

const { readonly } = useFormFallbackProps([formProps ?? {}, props])

const cls = bem('steps')

const selectStep = (key: string) => {
  if (!readonly.value) emit('update:active', key)
}
</script>
