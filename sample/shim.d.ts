export {}

declare module 'vue' {
  interface ComponentCustomProperties {
    c: Console
  }
}
