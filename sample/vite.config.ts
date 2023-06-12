import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueJSX from '@vitejs/plugin-vue-jsx'
import Components from 'unplugin-vue-components/vite'

function UIResolver(componentName: string) {
  if (componentName.startsWith('U')) {
    return {
      name: componentName,
      from: '..',
      sideEffects: `../style.scss`
    }
  }
}
export default defineConfig({
  base: '/',

  resolve: {
    extensions: ['.ts', '.js', '.json', '.tsx']
  },

  plugins: [
    Vue(),
    VueJSX(),
    Components({
      resolvers: [UIResolver],
      dts: true,
      include: [/\.vue$/]
    })
  ],

  server: {
    port: 7788,
    host: true
  }
})
