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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  padding: 16px 12px 14px;
  border: 1px solid var(--u-border-color);
  border-radius: var(--u-radius-large);
  background: var(--u-bg-color-top);
  color: inherit;
  font-family: inherit;
  text-align: center;
  cursor: pointer;
  transition:
    border-color var(--u-transition-fast) var(--u-transition-ease),
    box-shadow var(--u-transition-fast) var(--u-transition-ease);
}

.icon-combo-cell__main:hover,
.icon-combo-cell__main:focus-visible {
  border-color: var(--u-border-muted-color);
  box-shadow: var(--u-shadow-sm);
}

.icon-combo-cell__preview-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
  min-height: 68px;
  padding: 10px 12px;
  border-radius: var(--u-radius-default);
  background: var(--u-bg-color-hover);
  color: var(--u-text-color-title);
}

.icon-combo-cell__solo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--u-radius-small);
  background: var(--u-bg-color-top);
  box-shadow: inset 0 0 0 1px var(--u-text-color-title-a-8);
}

.icon-combo-cell__plus,
.icon-combo-cell__eq {
  padding: 0 2px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  color: var(--u-text-color-second);
}

.icon-combo-cell__stack {
  position: relative;
  display: block;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  background: var(--u-bg-color-top);
  box-shadow: inset 0 0 0 1px var(--u-text-color-title-a-22);
}

.icon-combo-cell__stack--lg {
  width: 48px;
  height: 48px;
  border-radius: var(--u-radius-small);
}

.icon-combo-cell__layer {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  width: 16px !important;
  height: 16px !important;
}

.icon-combo-cell__layer--lg {
  width: 48px !important;
  height: 48px !important;
}

.icon-combo-cell__glyph {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--u-radius-default);
  background: var(--u-bg-color-hover);
  color: var(--u-text-color-title);
}

.icon-combo-cell__glyph--row {
  gap: 6px;
  width: auto;
  min-width: 48px;
  padding: 0 8px;
}

.icon-combo-cell__svg {
  display: block;
  width: 16px !important;
  height: 16px !important;
}

.icon-combo-cell__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--u-text-color-title);
}

.icon-combo-cell__desc {
  max-width: 320px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--u-text-color-second);
}

.icon-combo-cell__names {
  font-size: 11px;
  line-height: 1.3;
  color: var(--u-text-color-placeholder);
  font-variant-ligatures: none;
  overflow-wrap: anywhere;
}
</style>
