# UWatermark 示例

## 基础文字水印

```vue
<u-watermark text="内部资料">
  <div style="height: 400px; padding: 24px">
    <h2>机密文档</h2>
    <p>此内容受到水印保护。</p>
  </div>
</u-watermark>
```

## 自定义旋转角度与字号

```vue
<u-watermark text="CONFIDENTIAL" :font-size="40" :route="-20">
  <div style="height: 300px; padding: 20px">
    <p>低密度水印适用于深色背景内容。</p>
  </div>
</u-watermark>
```

## 传送至 body 全屏水印

```vue
<u-watermark text="Admin@张三" :append-to-body="true" />

<!-- 水印将被 Teleport 到 <body>，覆盖整个页面 -->
```

## 图片水印

```vue
<u-watermark image="https://example.com/company-logo.png">
  <div style="height: 300px; padding: 20px">
    <p>使用公司 Logo 作为水印背景。</p>
  </div>
</u-watermark>
```
