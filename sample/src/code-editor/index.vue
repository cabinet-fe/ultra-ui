<template>
  <div>
    <div>
      <u-radio-group
        v-model="language"
        :items="[
          { value: 'js', label: 'js' },
          { value: 'sql', label: 'sql' },
          { value: 'java', label: 'java' }
        ]"
      ></u-radio-group>
    </div>

    <u-code-editor v-model="code" :language="language"></u-code-editor>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const code = ref('')
const language = ref<'js' | 'sql' | 'java'>('js')
</script>

<style lang="scss" scoped></style>
