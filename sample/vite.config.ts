import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueJSX from '@vitejs/plugin-vue-jsx'
import Components from 'unplugin-vue-components/vite'
import { kebabCase } from 'cat-kit'
import autoprefixer from 'autoprefixer'

function UIResolver(componentName: string) {
  if (componentName.startsWith('U')) {
    return {
      name: componentName,
      from: 'ultra-ui',
      sideEffects: `@ui/components/${kebabCase(componentName.slice(1))}/style`
    }
  }
}
export default defineConfig({
  base: '/',

  resolve: {
    extensions: ['.ts', '.js', '.json', '.tsx']
  },

  plugins: [
    Vue({
      script: {
        defineModel: true
      }
    }),
    VueJSX(),
    Components({
      resolvers: [UIResolver],
      dts: true,
      include: [/\.vue$/]
    })
  ],

  css: {
    postcss: {
      plugins: [autoprefixer]
    }
  },

  server: {
    port: 7788,
    host: true
  }
})
