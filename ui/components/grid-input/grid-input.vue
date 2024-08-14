<template>
  <ul :class="[cls.b, cls.m(size)]">
    <li
      v-for="(_, index) in length"
      :key="index"
      tabindex="0"
      @keydown="onKeydown($event, valueArray[index]!, index)"
      @focus="focus(index)"
      @blur="index === position && (blur = true)"
      ref="items"
      :class="[cls.e('item'), bem.is('focus', index === position && !blur)]"
    >
      <span :class="cls.em('item', 'text')" v-if="valueArray[index]">
        {{ valueArray[index] }}
      </span>

      <span :class="cls.em('item', 'cursor')" v-else-if="index === position"></span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { computed, ref, getCurrentInstance } from 'vue'
import type {
  GridInputProps,
  GridInputEmits,
  GridInputExposed
} from '@ui/types/components/grid-input'
import { bem } from '@ui/utils'
import { useFallbackProps } from '@ui/compositions'

defineOptions({
  name: 'GridInput'
})

const emit = defineEmits<GridInputEmits>()

const props = withDefaults(defineProps<GridInputProps>(), {
  length: 6,
  zero: false,
  separator: '-'
})

const { size } = useFallbackProps([props], {
  size: 'default'
})

const cls = bem('grid-input')

const _numberReg = computed(() => (props.zero ? /^[0-9]$/ : /^[1-9]$/))

const valueArray = ref<string[]>([])

const position = ref<number>(-1)

const blur = ref<boolean>(false)

const instance = getCurrentInstance()

const focus = async (index?: number) => {
  if (index === undefined) {
    focus(position.value)
    return
  }
  if (index !== 0 && index > valueArray.value.length) {
    index = valueArray.value.length
  }
  position.value = index
  let dom = (instance?.refs.items as any)[index]
  dom?.focus()
  blur.value = false
}

const changeValue = (value: string, index: number) => {
  if (position.value === props.length) return
  const currentValue = valueArray.value[index]

  if (currentValue) {
    valueArray.value.splice(index, 1, value)
  } else if (index === valueArray.value.length) {
    valueArray.value.push(value)
  } else {
    return
  }
  position.value++
  focus()

  emit('input', valueArray.value.filter((v) => v).join(props.separator))
}

const baseOperation = {
  Backspace: (value: string, index: number) => {
    if (value) {
      valueArray.value.splice(index, 1)
    } else if (index - 1 >= 0) {
      valueArray.value.splice(index - 1, 1)
    }
    if (index !== 0) {
      focus(index - 1)
    }
    emit('input', valueArray.value.filter((v) => v).join(props.separator))
  },
  ArrowLeft: (value: string, index: number) => {
    if (index === 0) return
    focus(index - 1)
  },
  ArrowRight: (value: string, index: number) => {
    if (index === valueArray.value.length) return
    focus(index + 1)
  }
}

const onKeydown = (e: any, value: string, index: number) => {
  if (_numberReg.value.test(e.key)) {
    changeValue(e.key, index)
    return
  }
  baseOperation[e.key](value, index)
}

const clear = () => {
  while (valueArray.value.length) {
    valueArray.value.pop()
  }
}

defineExpose<GridInputExposed>({ clear })
</script>
