<template>
  <u-dialog
    v-model="visible"
    title="下钻配置"
    style="width: min(560px, 92vw); max-height: 85vh"
    @close="onClose"
  >
    <div :class="cls.b">
      <section :class="cls.e('section')">
        <div :class="cls.e('label')">目标模板</div>
        <u-select
          size="small"
          placeholder="从模板列表选择目标"
          :model-value="target"
          :options="templateOptions"
          @update:model-value="onTarget"
        />
        <p :class="cls.e('hint')">目标模板仅从宿主提供的列表选择，不支持手填引用。</p>
      </section>

      <section :class="cls.e('section')">
        <div :class="cls.e('label')">打开方式</div>
        <u-radio-group
          size="small"
          :items="openModeItems"
          :model-value="openMode"
          @update:model-value="onOpenMode"
        />
      </section>

      <section :class="cls.e('section')">
        <div :class="cls.e('label')">字段 → 详情报参数映射</div>
        <p v-if="!target" :class="cls.e('hint')">先选择目标模板，再配置映射。</p>
        <p v-else-if="paramsLoading" :class="cls.e('hint')">正在解析目标模板参数…</p>
        <p v-else-if="paramsError" :class="cls.e('error')">{{ paramsError }}</p>
        <template v-else>
          <p v-if="targetParams.length === 0" :class="cls.e('hint')">
            目标模板没有查询参数，无需配置映射。
          </p>
          <ul v-else :class="cls.e('list')">
            <li v-for="(row, index) in mappings" :key="index" :class="cls.e('mapping')">
              <u-select
                size="small"
                :class="cls.e('field')"
                placeholder="字段"
                :model-value="row.field"
                :options="fieldOptions"
                @update:model-value="row.field = $event"
              />
              <span :class="cls.e('arrow')">→</span>
              <u-select
                size="small"
                :class="cls.e('param')"
                placeholder="参数"
                :model-value="row.param"
                :options="paramOptions"
                @update:model-value="row.param = $event"
              />
              <u-button size="small" text type="danger" @click="removeMapping(index)">
                删除
              </u-button>
            </li>
          </ul>
          <div v-if="targetParams.length > 0">
            <u-button size="small" plain @click="addMapping">添加映射</u-button>
          </div>
        </template>
      </section>
    </div>

    <template #footer>
      <u-button
        v-if="drill"
        size="small"
        text
        type="danger"
        style="margin-right: auto"
        @click="remove"
      >
        移除下钻
      </u-button>
      <u-button size="small" @click="visible = false">取消</u-button>
      <u-button size="small" type="primary" :disabled="!target" @click="confirm">确定</u-button>
    </template>
  </u-dialog>
</template>

<script lang="ts" setup>
import { UButton, UDialog, URadioGroup, USelect } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, ref, watch } from 'vue'

import type { ResolveReportTemplate } from '../../../report/drill'
import { resolveTemplateParams } from '../../../report/template'
import type {
  DatasetField,
  QueryParamDef,
  ReportDrillConfig,
  ReportTemplateListItem
} from '../../../report/types'

defineOptions({ name: 'UReportDrillDialog' })

/** 映射编辑行草稿（保存时折叠为 Record<字段, 参数>） */
interface MappingRow {
  field: string
  param: string
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** 宿主提供的可下钻目标模板列表（目标必选，无手填输入） */
    templates: ReportTemplateListItem[]
    /** 当前绑定所在数据集的字段 catalog */
    fields?: DatasetField[]
    /** 已有下钻配置（编辑时回填；缺省为新建） */
    drill?: ReportDrillConfig
    /** 宿主模板解析契约：选中目标后解析其查询参数；缺失时映射区给出可读提示 */
    resolveTemplate?: ResolveReportTemplate
  }>(),
  { fields: () => [], drill: undefined, resolveTemplate: undefined }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [drill: ReportDrillConfig]
  remove: []
}>()

const cls = bem('report-drill-dialog')

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const openModeItems = [
  { value: 'switch' as const, label: '查看器内切换' },
  { value: 'dialog' as const, label: '弹框打开（UDialog）' }
]

// ---- 草稿（打开时从 props.drill 回填） ----

const target = ref('')
const openMode = ref<ReportDrillConfig['openMode']>('switch')
const mappings = ref<MappingRow[]>([])

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    target.value = props.drill?.target ?? ''
    openMode.value = props.drill?.openMode ?? 'switch'
    mappings.value = Object.entries(props.drill?.mapping ?? {}).map(([field, param]) => ({
      field,
      param
    }))
    void resolveTargetParams(target.value)
  }
)

// ---- 目标模板参数解析（并发守卫：只应用最后一次解析） ----

const targetParams = ref<QueryParamDef[]>([])
const paramsLoading = ref(false)
const paramsError = ref('')
let paramsSeq = 0

async function resolveTargetParams(ref: string): Promise<void> {
  const seq = ++paramsSeq
  targetParams.value = []
  paramsError.value = ''
  if (!ref) return
  const resolve = props.resolveTemplate
  if (!resolve) {
    paramsError.value = '宿主未提供 resolveTemplate，无法解析目标模板参数'
    return
  }
  paramsLoading.value = true
  try {
    const template = await resolve(ref)
    if (seq !== paramsSeq) return
    targetParams.value = resolveTemplateParams(template)
  } catch (error) {
    if (seq !== paramsSeq) return
    paramsError.value = `解析目标模板参数失败：${error instanceof Error ? error.message : String(error)}`
  } finally {
    if (seq === paramsSeq) paramsLoading.value = false
  }
}

const templateOptions = computed(() =>
  props.templates.map((item) => ({ value: item.ref, label: item.label }))
)

const fieldOptions = computed(() =>
  props.fields.map((field) => ({ value: field.name, label: field.label }))
)

const paramOptions = computed(() =>
  targetParams.value.map((param) => ({
    value: param.id,
    label: param.label && param.label !== param.id ? `${param.label}（${param.id}）` : param.id
  }))
)

/** 用户改选目标：旧映射的参数 id 未必存在于新模板，直接清空重配 */
function onTarget(value: string): void {
  target.value = value ?? ''
  mappings.value = []
  void resolveTargetParams(target.value)
}

function onOpenMode(value: ReportDrillConfig['openMode']): void {
  openMode.value = value
}

function addMapping(): void {
  mappings.value = [...mappings.value, { field: '', param: '' }]
}

function removeMapping(index: number): void {
  mappings.value = mappings.value.filter((_, i) => i !== index)
}

function confirm(): void {
  if (!target.value) return
  const mapping: Record<string, string> = {}
  for (const row of mappings.value) {
    if (row.field && row.param) mapping[row.field] = row.param
  }
  emit('save', { target: target.value, mapping, openMode: openMode.value })
  visible.value = false
}

function remove(): void {
  emit('remove')
  visible.value = false
}

function onClose(): void {
  visible.value = false
}
</script>
