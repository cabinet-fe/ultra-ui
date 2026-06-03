# UText 示例

## 预设层级

```vue
<u-text as="main-title">这是主标题</u-text>
<u-text as="title">这是标题</u-text>
<u-text as="sub-title">这是副标题</u-text>
<u-text as="content">这是正文内容，as 默认即为 content</u-text>
<u-text as="additional">这是附加说明文字</u-text>
```

## 自定义字号与字体样式

```vue
<u-text font-size="20px">自定义 20px 文本</u-text>
<u-text :font-size="24">数字类型自动补 px</u-text>
<u-text bold>粗体文本</u-text>
<u-text bold italic>粗斜体文本</u-text>
<u-text deleted>已删除文本</u-text>
<u-text underline>带下划线的文本</u-text>
```

## 关键词高亮

```vue
<!-- 单个关键词高亮 -->
<u-text highlight="Vue">这是一段关于 Vue 框架的介绍文字</u-text>

<!-- 多个关键词高亮 -->
<u-text :highlight="['Vue', 'TypeScript']">
  Vue 3 配合 TypeScript 开发体验极佳
</u-text>

<!-- 结合预设 -->
<u-text as="content" :highlight="['重要', '关键']">
  这段文字中有重要和关键两个高亮词
</u-text>
```

## 组合用法

```vue
<u-text as="main-title" bold underline :highlight="['发布']" :font-size="22">
  新版本发布公告
</u-text>

<u-text as="additional" deleted italic>
  该功能已在下个版本中移除
</u-text>
```
