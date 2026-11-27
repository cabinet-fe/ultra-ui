<template>
  <u-card integrate size="small" :class="cls.e('group-card')">
    <u-card-header :class="cls.e('group-head')">
      <span :class="cls.e('group-title')">{{ group.title }}</span>
      <span v-if="groupChangedCount" :class="cls.e('group-changed')">
        {{ groupChangedCount }} 处已修改
      </span>
    </u-card-header>

    <u-card-content :class="[cls.e('group-body'), cls.em('group-body', group.layout)]">
      <template v-if="group.layout === 'color'">
        <div
          v-for="field in group.fields"
          :key="field.key"
          :class="[cls.e('swatch-item'), bem.is('changed', isChanged(field))]"
        >
          <u-palette
            size="small"
            :model-value="String(getValue(field) ?? '')"
            @update:model-value="(val) => emit('update', field, val)"
          />
          <span :class="cls.e('field-label')" :title="field.label">{{ field.label }}</span>
          <u-button
            v-if="isChanged(field)"
            text
            circle
            size="small"
            :icon="Rollback"
            :class="cls.e('reset-btn')"
            title="恢复默认"
            @click="emit('reset', field)"
          />
        </div>
      </template>

      <template v-else-if="group.layout === 'glass'">
        <div :class="[cls.e('glass'), bem.is('changed', groupChangedCount > 0)]">
          <div :class="cls.e('glass-toggle')">
            <span :class="cls.e('field-label')">启用毛玻璃效果</span>
            <u-switch
              size="small"
              :model-value="glassState.enabled"
              @update:model-value="(val) => emit('toggleGlass', !!val)"
            />
            <u-button
              v-if="groupChangedCount"
              text
              circle
              size="small"
              :icon="Rollback"
              :class="cls.e('reset-btn')"
              title="恢复默认"
              @click="emit('resetGlass')"
            />
          </div>

          <div :class="[cls.e('glass-sliders'), bem.is('disabled', !glassState.enabled)]">
            <div v-if="hasGlassField('bg.filter.blur')" :class="cls.e('glass-row')">
              <span :class="cls.e('field-label')">模糊强度</span>
              <div :class="cls.e('glass-slider')">
                <u-slider
                  size="small"
                  :min="0"
                  :max="40"
                  :disabled="!glassState.enabled"
                  :model-value="glassState.blur"
                  @update:model-value="
                    (val) => typeof val === 'number' && emit('updateGlassBlur', val)
                  "
                />
              </div>
              <span :class="cls.e('glass-val')">{{ glassState.blur }}px</span>
            </div>

            <div v-if="hasGlassField('bg.filter.saturate')" :class="cls.e('glass-row')">
              <span :class="cls.e('field-label')">背景饱和度</span>
              <div :class="cls.e('glass-slider')">
                <u-slider
                  size="small"
                  :min="100"
                  :max="260"
                  :disabled="!glassState.enabled"
                  :model-value="glassState.saturate"
                  @update:model-value="
                    (val) => typeof val === 'number' && emit('updateGlassSaturate', val)
                  "
                />
              </div>
              <span :class="cls.e('glass-val')">{{ glassState.saturate }}%</span>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div
          v-for="field in group.fields"
          :key="field.key"
          :class="[
            cls.e('inline-item'),
            bem.is('changed', isChanged(field)),
            bem.is('wide', !!field.wide)
          ]"
        >
          <span :class="cls.e('field-label')">{{ field.label }}</span>

          <u-palette
            v-if="field.kind === 'color'"
            size="small"
            :model-value="String(getValue(field) ?? '')"
            @update:model-value="(val) => emit('update', field, val)"
          />

          <u-number-input
            v-else-if="field.kind === 'number' || field.kind === 'duration'"
            size="small"
            :class="[
              cls.e('number-control'),
              bem.is('lg', field.max !== undefined && field.max >= 1000)
            ]"
            :clearable="false"
            :model-value="Number(getValue(field))"
            :min="field.min"
            :max="field.max"
            :step="field.step ?? 1"
            :suffix="field.unit ?? 'px'"
            @update:model-value="(val) => emit('update', field, val)"
          />

          <u-segment
            v-else-if="field.kind === 'segment' || field.kind === 'focus-ring'"
            size="small"
            :model-value="String(getValue(field))"
            :items="field.options ?? []"
            @update:model-value="(val) => emit('update', field, val)"
          />

          <u-select
            v-else-if="field.kind === 'select'"
            size="small"
            :class="[cls.e('select-control'), bem.is('wide', !!field.wide)]"
            :clearable="false"
            :model-value="String(getValue(field))"
            :options="getSelectOptions(field)"
            @update:model-value="(val) => emit('update', field, val)"
          >
            <template v-if="field.preview === 'font'" #default="{ option }">
              <span :style="{ fontFamily: option.value }">{{ option.label }}</span>
            </template>
          </u-select>

          <u-button
            v-if="isChanged(field)"
            text
            circle
            size="small"
            :icon="Rollback"
            :class="cls.e('reset-btn')"
            title="恢复默认"
            @click="emit('reset', field)"
          />
        </div>
      </template>
    </u-card-content>
  </u-card>
</template>

<script setup lang="ts">
import './style'
import { Rollback } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed } from 'vue'

import { UButton } from '../button'
import { UCard, UCardContent, UCardHeader } from '../card'
import { UNumberInput } from '../number-input'
import { UPalette } from '../palette'
import { USegment } from '../segment'
import { USelect } from '../select'
import { USlider } from '../slider'
import { USwitch } from '../switch'
import type { ThemeField, ThemeFieldOption, ThemeSubGroup } from './schema'
import type { GlassFilterState } from './use-theme-editor'

defineOptions({ name: 'UThemeFieldGroup' })

const { group, changedKeys, glassState, getValue } = defineProps<{
  group: ThemeSubGroup
  changedKeys: Set<string>
  glassState: GlassFilterState
  getValue: (field: ThemeField) => string | number
}>()

const emit = defineEmits<{
  update: [field: ThemeField, value: string | number | undefined]
  reset: [field: ThemeField]
  toggleGlass: [enabled: boolean]
  updateGlassBlur: [px: number]
  updateGlassSaturate: [pct: number]
  resetGlass: []
}>()

const cls = bem('theme')

const isChanged = (field: ThemeField) => changedKeys.has(field.key)

const groupChangedCount = computed(() => {
  return group.fields.filter((f) => changedKeys.has(f.key)).length
})

const hasGlassField = (key: string) => group.fields.some((f) => f.key === key)

function getSelectOptions(field: ThemeField): ThemeFieldOption[] {
  const baseOptions = field.options ?? []
  const current = String(getValue(field) ?? '')
  if (!current || baseOptions.some((o) => o.value === current)) {
    return baseOptions
  }
  return [{ label: '当前主题预设', value: current }, ...baseOptions]
}
</script>
