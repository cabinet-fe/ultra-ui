<template>
  <section class="connection-form">
    <h4 class="connection-form__title">{{ isNew ? '新建连接' : '编辑连接' }}</h4>
    <div class="connection-form__grid">
      <div class="connection-form__field">
        <span class="connection-form__label">显示名</span>
        <u-input v-model="draft.label" size="small" placeholder="连接名称" />
      </div>
      <div class="connection-form__field">
        <span class="connection-form__label">类型</span>
        <u-select v-model="draft.type" size="small" :options="typeOptions" />
      </div>
      <div class="connection-form__field">
        <span class="connection-form__label">主机</span>
        <u-input v-model="draft.host" size="small" placeholder="127.0.0.1" />
      </div>
      <div class="connection-form__field">
        <span class="connection-form__label">端口</span>
        <u-input v-model="portText" size="small" type="number" placeholder="3306" />
      </div>
      <div class="connection-form__field">
        <span class="connection-form__label">数据库</span>
        <u-input v-model="draft.database" size="small" placeholder="demo_business" />
      </div>
      <div class="connection-form__field">
        <span class="connection-form__label">用户名</span>
        <u-input v-model="draft.username" size="small" />
      </div>
      <div class="connection-form__field">
        <span class="connection-form__label">密码</span>
        <u-input v-model="draft.password" size="small" type="password" show-password />
      </div>
    </div>

    <div v-if="testMessage" class="connection-form__test" :class="{ 'is-ok': testOk }">
      {{ testMessage }}
    </div>

    <div class="connection-form__actions">
      <u-button size="small" :loading="testing" @click="onTest">测试连接</u-button>
      <u-button v-if="!isNew" size="small" type="danger" plain @click="emit('remove')">
        删除连接
      </u-button>
      <u-button size="small" type="primary" @click="onSave">保存</u-button>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'

import type { DataConnection, DataHub } from '../dataset-hub'

defineOptions({ name: 'SheetReportConnectionForm' })

const props = defineProps<{ hub: DataHub; connection?: DataConnection; isNew?: boolean }>()

const emit = defineEmits<{ save: [connection: DataConnection]; remove: [] }>()

const typeOptions = [
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'API', value: 'api' }
]

const draft = reactive<DataConnection>({
  id: '',
  label: '',
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  database: '',
  username: '',
  password: ''
})

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
    if (!conn) {
      Object.assign(draft, {
        id: `conn-${Date.now()}`,
        label: '新连接',
        type: 'mysql',
        host: '127.0.0.1',
        port: 3306,
        database: 'demo_business',
        username: 'demo',
        password: 'demo'
      } satisfies DataConnection)
      return
    }
    Object.assign(draft, conn)
  },
  { immediate: true }
)

async function onTest(): Promise<void> {
  testing.value = true
  testMessage.value = ''
  await new Promise((r) => setTimeout(r, 120))
  if (props.isNew) {
    testOk.value = true
    testMessage.value = `将连接 ${draft.label}（${draft.host}:${draft.port}/${draft.database}）`
  } else {
    const result = await props.hub.testConnection(draft.id)
    testOk.value = result.ok
    testMessage.value = result.message
  }
  testing.value = false
}

function onSave(): void {
  emit('save', { ...draft })
}
</script>

<style scoped lang="scss">
.connection-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
}

.connection-form__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.connection-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.connection-form__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.connection-form__label {
  font-size: 12px;
  color: var(--u-text-color-secondary, #64748b);
}

.connection-form__test {
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
  background: var(--u-color-danger-light-9, #fef2f2);
  color: var(--u-color-danger, #dc2626);

  &.is-ok {
    background: var(--u-color-success-light-9, #f0fdf4);
    color: var(--u-color-success, #16a34a);
  }
}

.connection-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}
</style>
