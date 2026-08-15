<template>
  <u-drawer v-model="visibleModel" title="打开报表模板" show-close :class="cls.b">
    <div :class="cls.e('body')">
      <p v-if="loading" :class="cls.e('hint')">正在加载模板列表…</p>
      <p v-else-if="error" :class="cls.e('error')" role="alert">{{ error }}</p>
      <p v-else-if="items.length === 0" :class="cls.e('hint')">
        尚无已保存的模板，请先设计并保存。
      </p>

      <ul v-else :class="cls.e('list')">
        <li v-for="item in items" :key="item.id" :class="cls.e('item')">
          <button
            type="button"
            :class="[cls.e('open'), bem.is('active', item.id === activeTemplateId)]"
            @click="emit('open', item.id)"
          >
            <span :class="cls.e('name')">{{ item.name }}</span>
            <span :class="cls.e('meta')">更新于 {{ formatTime(item.updatedAt) }}</span>
          </button>
          <u-pop-confirm :title="`确定删除模板「${item.name}」？`" @confirm="remove(item.id)">
            <template #reference>
              <u-button size="small" text type="danger">删除</u-button>
            </template>
          </u-pop-confirm>
        </li>
      </ul>
    </div>
  </u-drawer>
</template>

<script lang="ts" setup>
import { UButton, UDrawer, UPopConfirm } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, ref, watch } from 'vue'

import {
  deleteReportTemplateRecord,
  listReportTemplates,
  type ReportTemplateSummary
} from './report-api'

defineOptions({ name: 'SheetReportTemplateLibrary' })

const props = defineProps<{ visible: boolean; activeTemplateId: string | null }>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  open: [id: string]
  deleted: [id: string]
}>()

const cls = bem('sheet-report-template-library')

const loading = ref(false)
const error = ref('')
const items = ref<ReportTemplateSummary[]>([])

const visibleModel = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
})

watch(
  () => props.visible,
  (open) => {
    if (open) void refresh()
  }
)

async function refresh(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    items.value = await listReportTemplates()
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
    items.value = []
  } finally {
    loading.value = false
  }
}

async function remove(id: string): Promise<void> {
  try {
    await deleteReportTemplateRecord(id)
    items.value = items.value.filter((item) => item.id !== id)
    emit('deleted', id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}

function formatTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}
</script>

<style scoped lang="scss">
.sheet-report-template-library {
  &__body {
    padding: 4px 0 16px;
  }

  &__hint {
    margin: 0;
    font-size: 13px;
    color: var(--u-text-color-secondary);
  }

  &__error {
    margin: 0;
    font-size: 13px;
    color: var(--u-color-danger);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--u-border-color);
    border-radius: 8px;
    background: var(--u-fill-color-blank);
  }

  &__open {
    flex: 1;
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;

    &.is-active {
      .sheet-report-template-library__name {
        color: var(--u-color-primary);
      }
    }
  }

  &__name {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--u-text-color-primary);
  }

  &__meta {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: var(--u-text-color-secondary);
  }
}
</style>
