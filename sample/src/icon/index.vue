<template>
  <div>
    <u-icon :size="16">
      <ArrowLeft />
    </u-icon>

    <u-icon :size="16">
      <ArrowRight />
    </u-icon>

    <u-icon :size="200">
      <Loading />
    </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { ArrowLeft, ArrowRight, Loading } from 'icon-ultra'
</script>
