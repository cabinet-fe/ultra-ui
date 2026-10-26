<template>
  <div class="demo">
    <section>
      <h3>基础（本地预览）</h3>
      <UUploader v-model="basicFiles" multiple />
      <p class="tip">共 {{ basicFiles.length }} 个文件</p>
    </section>

    <section>
      <h3>数量与大小限制</h3>
      <UUploader
        v-model="limitedFiles"
        :max-count="3"
        :max-size="200 * 1024"
        @oversize="oversizeCount++"
      />
      <p class="tip">最多 3 个、单文件不超过 200KB，超限 {{ oversizeCount }} 次</p>
    </section>

    <section>
      <h3>类型校验（beforeRead）</h3>
      <UUploader v-model="pdfOnlyFiles" accept=".pdf" :before-read="rejectNonPdf" />
      <p class="tip">仅收 pdf，其余在 beforeRead 拦截</p>
    </section>

    <section>
      <h3>自定义上传（模拟接口）</h3>
      <UUploader v-model="uploadedFiles" multiple :upload="fakeUpload" />
    </section>

    <section>
      <h3>文档文件回显</h3>
      <UUploader v-model="docFiles" @click-file="onDocClick" />
      <p class="tip">点击文档触发 click-file（图片类型则内置大图预览）</p>
    </section>

    <section>
      <h3>禁用 / 只读</h3>
      <UUploader :model-value="docFiles.slice(0, 1)" disabled />
      <div style="height: 8px"></div>
      <UUploader :model-value="docFiles" readonly deletable />
    </section>

    <section>
      <h3>表单行内</h3>
      <UForm :model="form">
        <UUploader v-model="form.attachments" field="attachments" label="报销附件" multiple />
      </UForm>
    </section>

    <section>
      <h3>自定义文件项 + 按文件控制删除</h3>
      <UUploader v-model="slotFiles" multiple :deletable="deletableOf">
        <template #item="{ file }">
          <div class="file-row">
            <span class="file-row__name">{{ file.name }}</span>
            <span class="file-row__size">{{ formatSize(file.size) }}</span>
          </div>
        </template>
      </UUploader>
      <p class="tip">函数式 deletable：「受保护.pdf」不显示删除按钮</p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UForm, UUploader } from '@veltra/mobile'
import type { UploaderFileItem } from '@veltra/mobile'
import { reactive, shallowRef } from 'vue'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/form-item/style'
import '@veltra/mobile/components/uploader/style'

const basicFiles = shallowRef<UploaderFileItem[]>([])

const limitedFiles = shallowRef<UploaderFileItem[]>([])
const oversizeCount = shallowRef(0)

const pdfOnlyFiles = shallowRef<UploaderFileItem[]>([])

const rejectNonPdf = (file: File) => file.name.toLowerCase().endsWith('.pdf')

const uploadedFiles = shallowRef<UploaderFileItem[]>([])

/** 模拟接口：延时后返回本地地址 */
const fakeUpload = (file: File) =>
  new Promise<string>((resolve) => {
    setTimeout(() => resolve(URL.createObjectURL(file)), 1200)
  })

// 文档回显：url 不真实存在也不影响瓦片展示，点击交给宿主处理
const docFiles = shallowRef<UploaderFileItem[]>([
  { url: '', name: '报销单据.pdf', size: 1024 * 512 },
  { url: '', name: '费用明细.xlsx', size: 1024 * 64 },
  { url: '', name: '差旅说明.docx', size: 1024 * 128 }
])

const onDocClick = (file: UploaderFileItem) => {
  console.log('click-file', file.name)
}

const form = reactive({ attachments: [] as UploaderFileItem[] })

const slotFiles = shallowRef<UploaderFileItem[]>([
  { url: '', name: '会议纪要.docx', size: 1024 * 96 },
  { url: '', name: '受保护.pdf', size: 1024 * 300 },
  { url: '', name: '扫描件.jpg', size: 1024 * 1024 }
])

/** 函数式 deletable：受保护文件不显示删除按钮 */
const deletableOf = (file: UploaderFileItem) => file.name !== '受保护.pdf'

const formatSize = (size?: number) => {
  if (!size) return ''
  return size >= 1024 * 1024
    ? `${(size / 1024 / 1024).toFixed(1)}MB`
    : `${Math.ceil(size / 1024)}KB`
}
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证移动端密度与触控热区
.demo {
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-color-title);
  }
}

.tip {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--u-text-color-second);
}

.file-row {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 8px;
  background-color: var(--u-color-default-light-9);
  cursor: pointer;

  &__name {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: var(--u-text-color-main);
  }

  &__size {
    font-size: 12px;
    color: var(--u-text-color-assist);
  }
}
</style>
