<template>
  <u-steps :items="items" :current="1" animation="pulse" size="small" />
</template>

<script setup lang="ts">
const items = [{ label: '步骤1' }, { label: '步骤2' }, { label: '步骤3' }]
</script>
