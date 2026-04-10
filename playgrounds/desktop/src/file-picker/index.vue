<template>
  <div>
    <CustomCard title="基础上传">
      <u-file-picker @pick="files = [...files, ...$event]">
        <u-button>上传文件</u-button>
      </u-file-picker>
      <ul>
        <li v-for="file of files">{{ file.name }} {{ file.size }}</li>
      </ul>
    </CustomCard>

    <CustomCard title="多文件上传">
      <u-file-picker multiple @pick="files = [...files, ...$event]">
        <u-button>上传文件</u-button>
      </u-file-picker>
      <ul>
        <li v-for="file of files">{{ file.name }} {{ file.size }}</li>
      </ul>
    </CustomCard>

    <CustomCard title="图片上传">
      <u-file-picker accept="image/*" @pick="files = [...files, ...$event]">
        <u-button>上传文件</u-button>
      </u-file-picker>
    </CustomCard>

    <CustomCard title="拖拽上传">
      <u-file-picker
        v-slot="{ isDragover }"
        class="upload-dragger"
        @pick="files = [...files, ...$event]"
      >
        <div class="upload-content" :class="{ 'is-dragover': isDragover }">
          <div class="icon">
            <u-icon><Upload /></u-icon>
          </div>
          <div class="text">
            <span v-if="isDragover">释放以上传文件</span>
            <span v-else>将文件拖到此处，或<em>点击上传</em></span>
          </div>
        </div>
      </u-file-picker>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { Upload } from '@ultra-ui/icons/normal'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const files = shallowRef<File[]>([])
</script>

<style scoped>
.upload-dragger {
  display: block;
  width: 100%;
}

.upload-content {
  background-color: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  box-sizing: border-box;
  text-align: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  padding: 40px 0;
  transition:
    border-color 0.3s,
    background-color 0.3s;
}

.upload-content:hover,
.upload-content.is-dragover {
  border-color: var(--u-primary-color, #409eff);
  background-color: var(--u-primary-color-light, rgba(64, 158, 255, 0.05));
}

.icon {
  font-size: 48px;
  color: #8c939d;
  margin-bottom: 16px;
  line-height: 1;
}

.text {
  color: #606266;
  font-size: 14px;
}

.text em {
  color: var(--u-primary-color, #409eff);
  font-style: normal;
  font-weight: 500;
}
</style>
