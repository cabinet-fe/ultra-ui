<template>
  <div :class="cls.b">
    <ul :class="cls.e('pages')">
      <li :class="cls.e('btn')" @click="jump('first')">
        <UIcon :size="14"><DArrowLeft /></UIcon>
      </li>
      <li :class="cls.e('btn')" @click="jump('prev')">
        <UIcon :size="14"><ArrowLeft /></UIcon>
      </li>
      <li
        v-for="page in pages"
        :class="[cls.e('btn'), bem.is('active', pageNumber === page)]"
        @click="selectPage(page)"
      >
        {{ page }}
      </li>
      <li :class="cls.e('btn')" @click="jump('next')">
        <UIcon :size="14"><ArrowRight /></UIcon>
      </li>
      <li :class="cls.e('btn')" @click="jump('last')">
        <UIcon :size="14"><DArrowRight /></UIcon>
      </li>
    </ul>

    <u-select
      :model-value="String(pageSize)"
      :options="
        pageSizeOptions.map((item) => {
          return { label: String(item), value: String(item) }
        })
      "
      @update:model-value="changePageSize"
    />
  </div>
</template>

<script lang="ts" setup>
import type { PaginatorProps, PaginatorEmits } from '@ui/types/components/paginator'
import { bem } from '@ui/utils'
import { useFormFallbackProps, useFormComponent } from '@ui/compositions'
import { computed } from 'vue'
import { n } from 'cat-kit/fe'
import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight } from 'icon-ultra'
import { UButton, USelect, UIcon } from '..'

defineOptions({
  name: 'Paginator'
})

const props = withDefaults(defineProps<PaginatorProps>(), {
  size: 'large'
})

const emit = defineEmits<PaginatorEmits>()

const { formProps } = useFormComponent()

const {} = useFormFallbackProps([formProps ?? {}, props])

const cls = bem('paginator')

const pages = computed(() => {
  return n.div(props.total, props.pageSize)
})

const changePageSize = (data) => {
  console.log(data)
}

const selectPage = (page: number) => {
  emit('update:pageNumber', page)
}

const jump = (key: 'first' | 'last' | 'prev' | 'next') => {
  switch (key) {
    case 'first':
      emit('update:pageNumber', 1)
      break
    case 'last':
      emit('update:pageNumber', pages.value)
      break
    case 'prev':
      emit('update:pageNumber', props.pageNumber > 1 ? props.pageNumber - 1 : 1)
      break
    case 'next':
      emit(
        'update:pageNumber',
        props.pageNumber === pages.value ? pages.value : props.pageNumber + 1
      )
      break
  }
}
</script>
