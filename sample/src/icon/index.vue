<template>
  <div>
    <u-icon :size="16">
      <ArrowLeft />
    </u-icon>

    <u-icon :size="16">
      <ArrowRight />
    </u-icon>

    <u-icon :size="200">
      <LoaderCircle />
    </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-vue-next'
</script>
