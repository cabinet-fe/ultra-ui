<template>
  <div class="icon-demo">
    <u-icon :size="16">
      <ArrowLeft />
    </u-icon>

    <u-icon :size="16">
      <ArrowRight />
    </u-icon>

    <u-icon :size="200">
      <Loading />
    </u-icon>

    <u-icon :size="20">
      <Check />
    </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { ArrowLeft, ArrowRight, Check, Loading } from '@ultra-ui/icons/normal'
</script>
