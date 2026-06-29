import unpluginVue from 'unplugin-vue/rolldown'
import { defineConfig } from 'vite-plus'

const config = {
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
}

export default defineConfig(config as Parameters<typeof defineConfig>[0])
