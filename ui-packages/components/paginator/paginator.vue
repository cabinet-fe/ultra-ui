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
        v-for="page in showPages"
        :class="[cls.e('btn'), bem.is('active', pageNumber === page)]"
        @click="jump(page)"
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
import { n } from 'cat-kit'
import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight } from 'icon-ultra'
import { USelect, UIcon } from '..'

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
/** 完整页码 */
const pages = computed(() => {
  return Array.from({ length: n.div(props.total, props.pageSize) }, (_, index) => index + 1)
})
/** 始终展示5个页码 */
const showPages = computed(() => {
  let startIndex = props.pageNumber > 3 ? props.pageNumber - 3 : 0
  if (props.pageNumber < 4) {
    startIndex = 0
  } else if (props.pageNumber + 2 < pages.value.length) {
    startIndex = props.pageNumber - 3
  } else {
    startIndex = pages.value.length - 5
  }
  return pages.value.slice(
    startIndex,
    props.pageNumber + 2 > pages.value.length ? pages.value.length : startIndex + 5
  )
})

/** 切换每页显示数据量 */
const changePageSize = (data) => {
  console.log(data)
}

/** 跳转页码 */
const jump = (key: 'first' | 'last' | 'prev' | 'next' | number) => {
  switch (key) {
    case 'first':
      emit('update:pageNumber', 1)
      break
    case 'last':
      emit('update:pageNumber', pages.value.length)
      break
    case 'prev':
      emit('update:pageNumber', props.pageNumber > 1 ? props.pageNumber - 1 : 1)
      break
    case 'next':
      emit(
        'update:pageNumber',
        props.pageNumber === pages.value.length ? pages.value.length : props.pageNumber + 1
      )
      break
    default:
      emit('update:pageNumber', key)
  }
}
</script>
