<template>
  <section :class="cls.b">
    <h4 :class="cls.e('title')">{{ isNew ? '新建连接' : '编辑连接' }}</h4>
    <div :class="cls.e('grid')">
      <div :class="cls.e('field')">
        <span :class="cls.e('label')">显示名</span>
        <u-input v-model="draft.label" size="small" placeholder="连接名称" />
      </div>
      <div :class="cls.e('field')">
        <span :class="cls.e('label')">类型</span>
        <u-select v-model="draft.type" size="small" :options="typeOptions" />
      </div>
      <div :class="cls.e('field')">
        <span :class="cls.e('label')">主机</span>
        <u-input v-model="draft.host" size="small" placeholder="127.0.0.1" />
      </div>
      <div :class="cls.e('field')">
        <span :class="cls.e('label')">端口</span>
        <u-input v-model="portText" size="small" type="number" :placeholder="String(defaultPort)" />
      </div>
      <div :class="cls.e('field')">
        <span :class="cls.e('label')">数据库</span>
        <u-input v-model="draft.database" size="small" placeholder="数据库名" />
      </div>
      <div :class="cls.e('field')">
        <span :class="cls.e('label')">用户名</span>
        <u-input v-model="draft.username" size="small" />
      </div>
      <div :class="cls.e('field')">
        <span :class="cls.e('label')">密码</span>
        <u-input v-model="draft.password" size="small" type="password" show-password />
      </div>
    </div>

    <div v-if="testMessage" :class="[cls.e('test'), bem.is('ok', testOk)]" role="status">
      {{ testMessage }}
    </div>

    <div :class="cls.e('actions')">
      <u-button size="small" :loading="testing" @click="onTest">测试连接</u-button>
      <u-button v-if="!isNew" size="small" type="danger" plain @click="emit('remove')">
        删除连接
      </u-button>
      <u-button size="small" type="primary" @click="onSave">保存</u-button>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { UButton, UInput, USelect } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, reactive, ref, watch } from 'vue'

import type { ConnectionType, DataConnection, Result } from '../../report/connector'
import { DEFAULT_CONNECTION_PORTS, resolvePortOnTypeChange } from '../../report/connector'

defineOptions({ name: 'UReportHubConnectionForm' })

const props = defineProps<{
  connection: DataConnection
  isNew?: boolean
  /** 真实测试连接（经 DataConnector；契约无状态，新建草稿同样可测） */
  test: (connection: DataConnection) => Promise<Result<void>>
}>()

const emit = defineEmits<{ save: [connection: DataConnection]; remove: [] }>()

const cls = bem('report-hub-connection-form')

/** 连接类型收敛为 MySQL / PostgreSQL（ADR-0003 决策 3） */
const typeOptions: { label: string; value: ConnectionType }[] = [
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' }
]

const draft = reactive<DataConnection>({ ...props.connection })

const defaultPort = computed(() => DEFAULT_CONNECTION_PORTS[draft.type])

const portText = computed({
  get: () => String(draft.port),
  set: (value: string) => {
    const n = Number(value)
    draft.port = Number.isFinite(n) ? n : 0
  }
})

const testing = ref(false)
const testMessage = ref('')
const testOk = ref(false)

watch(
  () => props.connection,
  (conn) => {
    testMessage.value = ''
    testOk.value = false
    Object.assign(draft, conn)
  },
  { immediate: true }
)

watch(
  () => draft.type,
  (type, prevType) => {
    if (!prevType) return
    draft.port = resolvePortOnTypeChange(prevType, type, draft.port)
  }
)

async function onTest(): Promise<void> {
  testing.value = true
  testMessage.value = ''
  const result = await props.test({ ...draft })
  testing.value = false
  testOk.value = result.ok
  testMessage.value = result.ok
    ? `连接成功：${draft.label}（${draft.host}:${draft.port}/${draft.database}）`
    : result.error.message
}

function onSave(): void {
  emit('save', { ...draft })
}
</script>
