<template></template>

<script lang="ts" setup>
import { useServerQuery } from '@ui/compositions'
import { ListProps } from './list.type'

defineOptions({
  name: 'List'
})

const props= defineProps<ListProps>()

useServerQuery(props)
</script>
