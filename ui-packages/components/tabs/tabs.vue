<template>
  <div :class="[cls.b, cls.e(tabPosition)]">
    <div :class="[cls.e('header'), cls.em('header', tabPosition)]">
      <div
        v-for="item in standardItems"
        :key="item.key"
        :class="[
          cls.em('header', 'label'),
          bem.is('active', modelValue === item.key)
        ]"
        @click="changeTab(item.key!)"
      >
        <slot :name="`${item?.name}-label`">
          {{ item.name }}
        </slot>
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
import { computed, getCurrentInstance } from 'vue'
import { TabsProps, type Item } from './tabs.type'
import { isObj } from 'cat-kit'
import { bem } from '@ui/utils'

defineOptions({
  name: 'Tabs'
})

const instance = getCurrentInstance()

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

const { items, tabPosition = 'top' } = defineProps<TabsProps>()

const standardItems = computed<Array<Item>>(() => {
  if (items.length) {
    return items.map((item) => {
      if (isObj(item)) {
        item.key = item.key || item.name
        return item
      } else {
        return { name: item, key: item }
      }
    })
  } else {
    return []
  }
})

const cls = bem('tabs')

const emits = defineEmits<{
  'update:modelValue': [key: string | number]
}>()

const changeTab = (key: string | number) => {
  emits('update:modelValue', key)
}
</script>
