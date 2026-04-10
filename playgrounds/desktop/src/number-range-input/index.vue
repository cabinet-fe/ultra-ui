<template>
  <div class="sample">
    <section>
      <h3>基础</h3>
      <p>v-model: {{ range }}</p>
      <u-number-range-input v-model="range" />
    </section>

    <section>
      <h3>min / max / step</h3>
      <u-number-range-input
        v-model="bounded"
        :min="0"
        :max="100"
        :step="5"
        start-placeholder="最小"
        end-placeholder="最大"
        separator="至"
      />
      <p>{{ bounded }}</p>
    </section>

    <section>
      <h3>禁用</h3>
      <u-number-range-input v-model="range" disabled />
    </section>

    <section>
      <h3>只读</h3>
      <u-number-range-input v-model="bounded" readonly />
    </section>

    <section>
      <h3>v-model:start / v-model:end</h3>
      <p>start: {{ splitStart }}，end: {{ splitEnd }}</p>
      <u-number-range-input
        v-model:start="splitStart"
        v-model:end="splitEnd"
        :min="0"
        :max="50"
        separator="至"
      />
    </section>
  </div>
</template>

<script lang="ts" setup>
import type { NumberRangeTuple } from '@ultra-ui/desktop/types'
import { ref } from 'vue'

const range = ref<NumberRangeTuple>([undefined, undefined])
const bounded = ref<NumberRangeTuple>([10, 80])
const splitStart = ref<number | undefined>(5)
const splitEnd = ref<number | undefined>(20)
</script>

<style scoped>
.sample {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

section h3 {
  margin: 0 0 8px;
  font-size: 14px;
}

section p {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--u-text-color-secondary, #888);
}
</style>
