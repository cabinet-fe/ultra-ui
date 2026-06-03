# UFilePicker 示例

## 基础点击选择

```vue
<script setup>
const handlePick = (files: File[]) => {
  console.log('选中文件:', files.map(f => f.name))
}
</script>

<template>
  <u-file-picker @pick="handlePick">
    <button>选择文件</button>
  </u-file-picker>
</template>
```

## 限制类型 & 多选

```vue
<script setup>
const handlePick = (files: File[]) => {
  // 仅 .pdf 或 image 文件会进入 files
  console.log(files)
}
</script>

<template>
  <u-file-picker accept=".pdf,image/*" multiple @pick="handlePick">
    <button>上传 PDF 或图片（可多选）</button>
  </u-file-picker>
</template>
```

## 拖拽上传 + 拖拽高亮

```vue
<script setup>
const handlePick = (files: File[]) => {
  console.log('拖入文件:', files.map(f => f.name))
}
</script>

<template>
  <u-file-picker @pick="handlePick" v-slot="{ isDragover }">
    <div :class="['drop-zone', isDragover && 'drop-zone--active']">
      {{ isDragover ? '松开即可上传' : '拖拽文件到此处，或点击选择' }}
    </div>
  </u-file-picker>
</template>

<style scoped>
.drop-zone {
  padding: 40px;
  border: 2px dashed #ccc;
  text-align: center;
  cursor: pointer;
}
.drop-zone--active {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.1);
}
</style>
```

## 自定义渲染标签

```vue
<template>
  <u-file-picker tag="span" accept="image/*" @pick="onPick">
    <a href="javascript:void(0)">点击上传图片</a>
  </u-file-picker>
</template>
```
