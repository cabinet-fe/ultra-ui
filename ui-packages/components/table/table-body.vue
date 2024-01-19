<template>
 <tbody :class="cls.e('body')">

 </tbody>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { TableDIKey } from './di'

const { cls } = inject(TableDIKey)!

</script>

<style lang="scss" scoped>

</style>