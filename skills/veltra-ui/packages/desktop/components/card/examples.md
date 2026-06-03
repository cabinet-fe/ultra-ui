# UCard 示例

## 基础卡片

```vue
<u-card width="320">
  <u-card-content>这是一张基础卡片</u-card-content>
</u-card>
```

## 带封面的卡片

```vue
<u-card width="360">
  <u-card-cover src="https://picsum.photos/360/200" height="200" />
  <u-card-header><h3>卡片标题</h3></u-card-header>
  <u-card-content>
    <p>卡片正文内容，描述这张卡片的相关信息。</p>
  </u-card-content>
  <u-card-action align-right>
    <u-button type="primary" text>操作一</u-button>
    <u-button type="primary" text>操作二</u-button>
  </u-card-action>
</u-card>
```

## 融合样式卡片

```vue
<u-card integrate>
  <u-card-header>无阴影卡片</u-card-header>
  <u-card-content>
    <p>当 integrate 为 true 时，卡片没有阴影，适合嵌入到其他容器中使用。</p>
  </u-card-content>
</u-card>
```

## 封面模式内容

```vue
<u-card width="400">
  <u-card-content cover>
    <img
      src="https://picsum.photos/400/180"
      alt="封面"
      style="width: 100%; border-radius: inherit"
    />
  </u-card-content>
  <u-card-header>自定义封面布局</u-card-header>
  <u-card-content>
    <p>使用 cover 模式可以让内容区无缝贴合图片。</p>
  </u-card-content>
</u-card>
```
