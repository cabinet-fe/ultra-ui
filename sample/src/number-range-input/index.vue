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

    <section>
      <h3>autoPair</h3>
      <p>
        仅填一侧后点到外部失焦，另一侧会自动与已填值相同，避免
        <code>[n, undefined]</code> / <code>[undefined, n]</code>。
      </p>
      <p>{{ mirrorPartial }}</p>
      <u-number-range-input v-model="mirrorPartial" auto-pair />
    </section>

    <section>
      <h3>元组与子模型同时绑定</h3>
      <p>
        两侧输入仍由元组 <code>v-model</code> 驱动；<code>v-model:start</code> /
        <code>v-model:end</code> 与之保持同步，便于父组件既拿元组又单独监听起止。
      </p>
      <p>元组: {{ combined }}；拆分: {{ combinedStart }} / {{ combinedEnd }}</p>
      <u-number-range-input
        v-model="combined"
        v-model:start="combinedStart"
        v-model:end="combinedEnd"
        :min="0"
        :max="100"
        separator="~"
      />
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { NumberRangeTuple } from 'ultra-ui'

const range = ref<NumberRangeTuple>([undefined, undefined])
const bounded = ref<NumberRangeTuple>([10, 80])
const splitStart = ref<number | undefined>(5)
const splitEnd = ref<number | undefined>(20)

const combined = ref<NumberRangeTuple>([12, 48])
const combinedStart = ref<number | undefined>(12)
const combinedEnd = ref<number | undefined>(48)

const mirrorPartial = ref<NumberRangeTuple>([undefined, undefined])
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
