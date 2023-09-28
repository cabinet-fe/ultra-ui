<template></template>

<script lang="ts" setup generic="TabsItems extends string[] | Array<{ name: string; key: string | number }>">
import type { TabsProps } from '@ui/types/components/tabs'

defineOptions({
  name: 'Tabs'
})

defineProps<TabsProps<TabsItems>>()
</script>
