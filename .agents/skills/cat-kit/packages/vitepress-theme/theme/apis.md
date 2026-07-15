# 主题 — API

```ts
// 包根 @cat-kit/vitepress-theme
declare const defaultTheme: {
  extends: typeof DefaultTheme
  Layout: typeof CatKitLayout
  enhanceApp(ctx: { app: App }): void
}
export default defaultTheme
export { CatKitLayout }
export {
  useConsoleInterceptor,
  useFullscreen,
  useDraggable
  // 以及各 composable 导出的类型
}
```

`DemoContainer` / `Mermaid` 由默认主题 `enhanceApp` 注册，一般无需手动导入。
