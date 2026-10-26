<template>
  <div :class="uploaderClass">
    <ul :class="cls.e('list')">
      <li
        v-for="(file, index) in modelValue"
        :key="index"
        :class="[cls.e('item'), bem.is('failed', file.status === 'failed')]"
        @click="handleClick(file, index)"
      >
        <slot name="item" :file="file" :index="index">
          <img
            v-if="isImageFile(file) && file.url"
            :src="file.url"
            :alt="file.name ?? ''"
            :class="cls.e('thumb')"
          />
          <div v-else :class="cls.e('file')">
            <span :class="cls.e('file-badge')" :style="{ backgroundColor: badgeColor(file) }">
              {{ badgeLabel(file) }}
            </span>
            <span :class="cls.e('file-name')">{{ file.name }}</span>
          </div>
        </slot>

        <span v-if="file.status === 'uploading'" :class="cls.e('mask')">
          <span :class="cls.e('spinner')"></span>
        </span>

        <button
          v-if="canRemove(file, index) && !disabled && !readonly"
          type="button"
          aria-label="删除"
          :class="cls.e('remove')"
          @click.stop="handleRemove(index)"
        >
          <Close />
        </button>
      </li>

      <li v-if="showTrigger" :class="cls.e('item')">
        <button
          type="button"
          aria-label="上传文件"
          :class="cls.e('trigger')"
          :disabled="disabled"
          @click="pick"
        >
          <Plus />
        </button>
      </li>
    </ul>

    <input
      ref="inputRef"
      type="file"
      :class="cls.e('native')"
      :accept="accept"
      :multiple="multiple"
      @change="handleChange"
    />

    <Teleport :to="getOverlayContainer()">
      <div
        v-if="previewUrl"
        :class="cls.e('previewer')"
        :style="{ zIndex: previewZIndex }"
        @click="closePreview"
      >
        <img :src="previewUrl" alt="" :class="cls.e('previewer-image')" />
        <button
          type="button"
          aria-label="关闭"
          :class="cls.e('previewer-close')"
          @click.stop="closePreview"
        >
          <Close />
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { Close, Plus } from '@veltra/icons/normal'
import { injectFormContext, zIndex } from '@veltra/utils'
import { computed, reactive, ref } from 'vue'

import { bem } from '../../shared/bem'
import type { UploaderEmits, UploaderFileItem, UploaderProps } from '../../types/uploader'
import { getOverlayContainer } from '../_internal/overlay-container'

defineOptions({ name: 'UUploader' })

// deletable 的联合类型必须内联在泛型里且函数成员在前：跨包 extends（@veltra/utils）解析链路下，
// 经类型文件引用或别名引用的联合都会被宏丢失 Function 运行时类型（实测 boolean|fn 与别名均塌缩为 Boolean）
const props = withDefaults(
  defineProps<
    UploaderProps & { deletable?: ((file: UploaderFileItem, index: number) => boolean) | boolean }
  >(),
  {
    accept: 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
    multiple: false,
    maxCount: Number.POSITIVE_INFINITY,
    deletable: true,
    preview: true,
    disabled: undefined,
    readonly: undefined
  }
)

const emit = defineEmits<UploaderEmits>()

defineSlots<{
  /** 自定义文件瓦片内容，作用域参数为 `file` 与 `index`；遮罩与删除按钮始终由组件渲染 */
  item?: (scope: { file: UploaderFileItem; index: number }) => any
}>()

const modelValue = defineModel<UploaderFileItem[]>()

const cls = bem('uploader')

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const uploaderClass = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', disabled.value),
    bem.is('readonly', readonly.value)
  ]
})

const inputRef = ref<HTMLInputElement>()

/** 数量未满且可交互时才展示上传入口 */
const showTrigger = computed(() => {
  if (disabled.value || readonly.value) return false
  return (modelValue.value?.length ?? 0) < props.maxCount
})

// ===== 文件类型识别（图片缩略图，其余走扩展名徽标） =====

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'heic', 'heif'])

function extOf(name?: string): string {
  if (!name) return ''
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1)
}

function isImageFile(file: UploaderFileItem): boolean {
  const ext = extOf(file.name)
  if (ext) return IMAGE_EXTS.has(ext.toLowerCase())
  // 无文件名的历史数据只能按地址猜测：data:image 与 blob 视为图片
  return /^data:image|^blob:/.test(file.url)
}

/** 扩展名徽标：文案 + 品牌底色（文件格式的行业惯用色，非主题色，不随暗色切换） */
const BADGES: Record<string, { label: string; color: string }> = {
  pdf: { label: 'PDF', color: '#fa5151' },
  doc: { label: 'DOC', color: '#2b7cd3' },
  docx: { label: 'DOC', color: '#2b7cd3' },
  xls: { label: 'XLS', color: '#217346' },
  xlsx: { label: 'XLS', color: '#217346' }
}

const FALLBACK_BADGE = { label: 'FILE', color: '#909399' }

function badgeOf(file: UploaderFileItem) {
  return BADGES[extOf(file.name).toLowerCase()] ?? FALLBACK_BADGE
}

const badgeLabel = (file: UploaderFileItem) => badgeOf(file).label

const badgeColor = (file: UploaderFileItem) => badgeOf(file).color

// ===== 选择与读取 =====

function pick() {
  if (disabled.value || readonly.value) return
  inputRef.value?.click()
}

/** accept 匹配：扩展名项（.pdf）按扩展名比对，MIME 项（application/pdf、image/*）按类型精确或通配比对 */
function matchAccept(file: File): boolean {
  const tokens = props.accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
  const mimes = tokens.filter((token) => !token.startsWith('.'))
  if (
    file.type &&
    mimes.some(
      (mime) =>
        mime === file.type || (mime.endsWith('/*') && file.type.startsWith(mime.slice(0, -1)))
    )
  ) {
    return true
  }
  const ext = extOf(file.name).toLowerCase()
  return Boolean(ext) && tokens.includes(`.${ext}`)
}

async function handleChange(event: Event) {
  const input = event.target as HTMLInputElement
  const picked = Array.from(input.files ?? [])
  input.value = ''

  if (!picked.length || disabled.value || readonly.value) return

  const remaining = props.maxCount - (modelValue.value?.length ?? 0)
  if (remaining <= 0) return

  const oversize: File[] = []
  const candidates: File[] = []

  for (const file of picked.slice(0, remaining)) {
    if (!matchAccept(file)) continue
    if (props.maxSize && file.size > props.maxSize) {
      oversize.push(file)
      continue
    }
    candidates.push(file)
  }

  if (oversize.length) emit('oversize', oversize)
  if (!candidates.length) return

  // beforeRead 并行校验，返回 false 或抛异常的文件剔除
  const checked = await Promise.all(
    candidates.map(async (file) => {
      try {
        return ((await props.beforeRead?.(file)) ?? true) && file
      } catch {
        return false
      }
    })
  )
  const accepted = checked.filter((file): file is File => Boolean(file))
  if (!accepted.length) return

  const items = await Promise.all(accepted.map((file) => toItem(file)))
  const next = [...(modelValue.value ?? []), ...items]
  modelValue.value = next
  emit('change', next)
}

/** File → 列表项：无 upload 时本地 blob 直显；有 upload 先占位再回填地址（reactive 包装保证异步回填触发视图更新） */
async function toItem(file: File): Promise<UploaderFileItem> {
  const base: UploaderFileItem = { name: file.name, size: file.size }

  if (!props.upload) return { ...base, url: URL.createObjectURL(file), status: 'done' }

  const item = reactive<UploaderFileItem>({ ...base, url: '', status: 'uploading' })
  props
    .upload(file)
    .then((url) => {
      item.url = url
      item.status = 'done'
    })
    .catch(() => {
      item.status = 'failed'
    })
  return item
}

// ===== 操作（deletable 支持按文件控制删除按钮显隐）=====

function canRemove(file: UploaderFileItem, index: number): boolean {
  return typeof props.deletable === 'function'
    ? props.deletable(file, index)
    : props.deletable !== false
}

function handleRemove(index: number) {
  if (disabled.value || readonly.value) return
  const files = [...(modelValue.value ?? [])]
  const [file] = files.splice(index, 1)
  if (!file) return
  modelValue.value = files
  // 仅回收组件自身创建的本地预览地址
  if (file.url.startsWith('blob:')) URL.revokeObjectURL(file.url)
  emit('delete', file, index)
  emit('change', files)
}

const previewUrl = ref('')
const previewZIndex = ref(0)

function handleClick(file: UploaderFileItem, index: number) {
  // 只读态保留预览能力（查看场景）；禁用态完全不可交互
  if (disabled.value) return
  emit('click-file', file, index)
  if (props.preview && file.status !== 'uploading' && isImageFile(file)) {
    previewUrl.value = file.url
    previewZIndex.value = zIndex()
  }
}

function closePreview() {
  previewUrl.value = ''
}
</script>
