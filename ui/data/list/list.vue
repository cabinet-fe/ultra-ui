<template></template>

<script lang="ts" setup>
import { useServerQuery } from '@ui/hooks'
import { ListProps } from './list.type'

defineOptions({
  name: 'UList'
})

const props= defineProps<ListProps>()

useServerQuery(props)
</script>
