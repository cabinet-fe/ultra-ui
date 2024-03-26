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
        v-if="size === 'large'"
        v-for="page in showPages"
        :class="[cls.e('btn'), bem.is('active', pageNumber === page)]"
        @click="jump(page)"
      >
        {{ page }}
      </li>
      <li v-else :class="cls.e('input')">
        <UNumberInput
          size="small"
          :min="1"
          :max="pages.length"
          :precision="0"
          v-model="currentPage"
          :clearable="false"
          @change="(val) => jump(val as number)"
        />/{{ pages.length }}
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
import { computed, ref } from 'vue'
import { n } from 'cat-kit/fe'
import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight } from 'icon-ultra'
import { USelect, UIcon, UNumberInput } from '..'

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

const currentPage = ref<number>(props.pageNumber)

/** 跳转页码 */
const jump = (key: 'first' | 'last' | 'prev' | 'next' | number) => {
  switch (key) {
    case 'first':
      currentPage.value = 1
      break
    case 'last':
      currentPage.value = pages.value.length
      break
    case 'prev':
      currentPage.value = props.pageNumber > 1 ? props.pageNumber - 1 : 1
      break
    case 'next':
      currentPage.value =
        props.pageNumber === pages.value.length ? pages.value.length : props.pageNumber + 1
      break
    default:
      currentPage.value = key
  }
  emit('update:pageNumber', currentPage.value)
}
</script>
