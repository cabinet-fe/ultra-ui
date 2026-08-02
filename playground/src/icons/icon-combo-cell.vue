<script setup lang="ts">
import type { Component } from 'vue'

export interface IconCombo {
  id: string
  title: string
  description: string
  icons: { pascal: string; component: Component }[]
  layout: 'overlay' | 'row'
}

const props = defineProps<{ combo: IconCombo }>()

const emit = defineEmits<{ toast: [message: string, detail?: string] }>()

function buildComboCode(): string {
  const names = props.combo.icons.map((i) => i.pascal)
  const importLine = `import { ${names.join(', ')} } from '@veltra/icons/normal'`
  if (props.combo.layout === 'overlay') {
    const layers = names.map((n) => `    <${n} />`).join('\n')
    return `${importLine}\n\n<span class="icon-combo" style="position:relative;display:inline-block;width:1em;height:1em;font-size:16px">\n${layers}\n</span>`
  }
  return `${importLine}\n\n${names.map((n) => `<${n} />`).join(' ')}`
}

async function copyComboCode() {
  try {
    const code = buildComboCode()
    await navigator.clipboard.writeText(code)
    emit('toast', '已复制组合代码', code)
  } catch {
    /* clipboard unavailable */
  }
}
</script>

<template>
  <li class="icon-combo-cell">
    <button type="button" class="icon-combo-cell__main" @click="copyComboCode">
      <template v-if="combo.layout === 'overlay'">
        <span class="icon-combo-cell__preview-row" aria-hidden="true">
          <span
            v-for="icon in combo.icons"
            :key="`solo-${icon.pascal}`"
            class="icon-combo-cell__solo"
            :title="icon.pascal"
          >
            <component :is="icon.component" class="icon-combo-cell__svg" />
          </span>
          <span class="icon-combo-cell__plus">→</span>
          <!-- 放大叠层：同一 viewBox 坐标系，宽高同步放大，保证偏置关系不变 -->
          <span class="icon-combo-cell__stack icon-combo-cell__stack--lg">
            <component
              :is="icon.component"
              v-for="icon in combo.icons"
              :key="`lg-${icon.pascal}`"
              class="icon-combo-cell__layer icon-combo-cell__layer--lg"
            />
          </span>
          <span class="icon-combo-cell__eq">=</span>
          <span class="icon-combo-cell__stack" title="实际 16×16">
            <component
              :is="icon.component"
              v-for="icon in combo.icons"
              :key="`sm-${icon.pascal}`"
              class="icon-combo-cell__layer"
            />
          </span>
        </span>
      </template>

      <span v-else class="icon-combo-cell__glyph icon-combo-cell__glyph--row" aria-hidden="true">
        <component
          :is="icon.component"
          v-for="icon in combo.icons"
          :key="icon.pascal"
          class="icon-combo-cell__svg"
        />
      </span>

      <span class="icon-combo-cell__title">{{ combo.title }}</span>
      <span class="icon-combo-cell__desc">{{ combo.description }}</span>
      <span class="icon-combo-cell__names">
        {{ combo.icons.map((i) => i.pascal).join(' + ') }}
      </span>
    </button>
  </li>
</template>

<style scoped>
.icon-combo-cell {
  margin: 0;
  list-style: none;
}

.icon-combo-cell__main {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.1rem 0.85rem 0.95rem;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;
}

.icon-combo-cell__main:hover {
  border-color: #d4d4d4;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.icon-combo-cell__main:active {
  transform: translateY(0);
}

.icon-combo-cell__preview-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  min-height: 4.25rem;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  background: #f5f5f5;
  color: #171717;
}

.icon-combo-cell__solo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(23, 23, 23, 0.08);
}

.icon-combo-cell__plus,
.icon-combo-cell__eq {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #a3a3a3;
  line-height: 1;
  padding: 0 0.15rem;
}

.icon-combo-cell__stack {
  position: relative;
  display: block;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(23, 23, 23, 0.18);
  border-radius: 2px;
  background: #fff;
}

.icon-combo-cell__stack--lg {
  width: 48px;
  height: 48px;
  border-radius: 4px;
}

.icon-combo-cell__layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 16px !important;
  height: 16px !important;
  display: block;
}

.icon-combo-cell__layer--lg {
  width: 48px !important;
  height: 48px !important;
}

.icon-combo-cell__glyph {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  color: #171717;
  border-radius: 8px;
  background: #f5f5f5;
}

.icon-combo-cell__glyph--row {
  gap: 0.35rem;
  width: auto;
  min-width: 3rem;
  padding: 0 0.5rem;
}

.icon-combo-cell__svg {
  display: block;
  width: 16px !important;
  height: 16px !important;
}

.icon-combo-cell__title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #171717;
  text-align: center;
}

.icon-combo-cell__desc {
  font-size: 0.6875rem;
  line-height: 1.35;
  color: #737373;
  text-align: center;
  max-width: 20rem;
}

.icon-combo-cell__names {
  font-size: 0.625rem;
  line-height: 1.3;
  color: #a3a3a3;
  text-align: center;
  font-variant-ligatures: none;
  word-break: break-all;
}
</style>
