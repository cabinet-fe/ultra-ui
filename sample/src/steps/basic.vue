<template>
  <u-steps :items="items" :current="1" animation="pulse"> </u-steps>
</template>

<script setup lang="ts">
const items = [{ label: '步骤1' }, { label: '步骤2' }, { label: '步骤3' }]
</script>
