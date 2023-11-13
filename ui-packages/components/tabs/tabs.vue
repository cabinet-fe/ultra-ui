<template>
  {{ props }}
  <div :class="[cls.b, cls.e(position!)]">
    <div :class="[cls.e('header'), cls.em('header', position!)]">
      <div
        v-for="item in standardItems"
        :key="item.key"
        :class="[cls.em('header', 'label'), bem.is('active', modelValue === item.key)]"
        @click="changeTab(item.key!)"
      >
        <slot :name="`${item?.name}-label`">
          {{ item.name }}
        </slot>
        <span v-if="closable" :class="bem.is('close')">x</span>
      </div>
    </div>
    <div :class="cls.e('content')" v-if="showContent">
      <div v-for="item in standardItems" :key="item.key">
        <div :class="cls.e('content')" v-if="modelValue === item.name">
          <slot :name="item?.name">
            <span>暂无内容~</span>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Item, TabsProps } from '@ui/types/components/tabs'
import { bem } from '@ui/utils'
import { isObj } from 'cat-kit'
import { computed, getCurrentInstance } from 'vue'

defineOptions({
  name: 'Tabs'
})

const props: TabsProps = withDefaults(defineProps<TabsProps>(), {
  position: 'right',
  closable: false
})

const instance = getCurrentInstance()!

const cls = bem('tabs')

const emit = defineEmits<{
  'update:modelValue': [key: string | number]
}>()

const showContent = computed(() => {
  if (instance?.slots) {
    const keys = Object.keys(instance?.slots)
    const slots = standardItems.value.filter((item: any) => {
      return keys.includes(item.key)
    })
    return !!slots.length
  } else {
    return false
  }
})

const standardItems = computed<Array<Item>>(() => {
  if (props.items.length) {
    if (isObj(props.items[0])) {
      return props.items.map((item: any) => {
        item.key = item.key || item.name
        return item
      })
    } else {
      return props.items.map((item: any) => {
        return { name: item, key: item }
      })
    }
  } else {
    return []
  }
})

const changeTab = (key: string | number) => {
  emit('update:modelValue', key)
}
</script>
