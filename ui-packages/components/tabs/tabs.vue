<template></template>

<script lang="ts" setup generic="TabsItems extends string[] | Array<{ name: string; key: string | number }>">
import { TabsProps } from './tabs.type'

defineOptions({
  name: 'Tabs'
})

defineProps<TabsProps<TabsItems>>()
</script>
