import unpluginVue from 'unplugin-vue/rolldown'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: ['src/index.ts', 'src/normal.ts', 'src/colorful.ts'],
    platform: 'browser',
    format: ['esm'],
    unbundle: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    deps: { neverBundle: ['vue'] },
    dts: { vue: true },
    plugins: [unpluginVue({ isProduction: true })]
  }
})
