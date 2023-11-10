<template></template>

<script lang="ts" setup>
import { useServerQuery } from '@ui/compositions'
import type { ListProps } from '@ui/types/components/list'

defineOptions({
  name: 'List'
})

const props= defineProps<ListProps>()

useServerQuery(props)
</script>
