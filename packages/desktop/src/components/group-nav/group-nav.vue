<template>
  <u-scroll tag="ul" :class="cls.b" :container-class="cls.e('container')">
    <li v-for="(group, index) of groups" :key="group.title || index" :class="cls.e('group')">
      <div :class="cls.e('group-label')">{{ group.title }}</div>
      <ul :class="cls.e('group-list')">
        <GroupNavItem
          v-for="(child, childIndex) of group.children"
          :key="child.path || childIndex"
          :item="child"
          :active="currentPath === child.path"
          @click="handleItemClick"
        />
      </ul>
    </li>
  </u-scroll>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'

import type { GroupNavEmits, GroupNavProps } from '../../types/group-nav'
import type { NavItem } from '../../types/nav'
import { UScroll } from '../scroll'
import GroupNavItem from './group-nav-item.vue'

defineOptions({ name: 'UGroupNav' })

defineProps<GroupNavProps>()
const emit = defineEmits<GroupNavEmits>()

const cls = bem('group-nav')

function handleItemClick(item: NavItem) {
  emit('item-click', item)
}
</script>
