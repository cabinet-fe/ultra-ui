# UWatermark — 水印

> `import type { WatermarkProps, WatermarkEmits, WatermarkExposed } from '@veltra/desktop'`

在页面或容器上叠加半透明水印文字或图片，通过 Canvas 生成平铺背景实现。支持旋转角度、字号、图片水印、传送至 body。

## Import

```ts
// UWatermark 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `text` | `string` | — | 水印文字内容 |
| `image` | `string` | — | 水印图片 URL，设置后覆盖文字水印 |
| `fontSize` | `number` | `60` | 水印文字字号（px） |
| `route` | `number` | `-30` | 水印旋转角度（度，非弧度） |
| `appendToBody` | `boolean` | — | 通过 `<Teleport>` 将水印传送至 `<body>` 下 |

## Emits

无事件。

## Slots

| slot | 说明 |
|------|------|
| `default` | 水印覆盖的内容区域，仅在 `appendToBody` 为 `false` 时渲染 |

## Exposed

```ts
interface WatermarkExposed {}
```

## Examples

### 基础文字水印

```vue
<u-watermark text="内部资料">
  <div style="height: 400px; padding: 24px">
    <h2>机密文档</h2>
    <p>此内容受到水印保护。</p>
  </div>
</u-watermark>
```

### 自定义旋转角度与字号

```vue
<u-watermark text="CONFIDENTIAL" :font-size="40" :route="-20">
  <div style="height: 300px; padding: 20px">
    <p>低密度水印适用于深色背景内容。</p>
  </div>
</u-watermark>
```

### 传送至 body 全屏水印

```vue
<u-watermark text="Admin@张三" :append-to-body="true" />

<!-- 水印将被 Teleport 到 <body>，覆盖整个页面 -->
```

### 图片水印

```vue
<u-watermark image="https://example.com/company-logo.png">
  <div style="height: 300px; padding: 20px">
    <p>使用公司 Logo 作为水印背景。</p>
  </div>
</u-watermark>
```
