declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, any>
  export default component
}

declare module '*.scss' {}

// 跨包样式副作用子路径（veltra-dev → src/* 无扩展名，TS 不做扩展探测）
declare module '@veltra/desktop/components/*/style' {}
