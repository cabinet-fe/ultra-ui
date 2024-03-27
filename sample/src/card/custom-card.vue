<template>
  <u-card>
    <u-card-header v-if="title"> {{ title }} </u-card-header>

    <u-card-content> <slot /> </u-card-content>
  </u-card>
</template>

<script lang="ts" setup>
defineProps<{
  title?: string
}>()
</script>
