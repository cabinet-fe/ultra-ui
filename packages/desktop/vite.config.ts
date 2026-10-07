import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { NodePackageImporter } from 'sass-embedded'
import unpluginVueJsx from 'unplugin-vue-jsx/rolldown'
import unpluginVue from 'unplugin-vue/rolldown'
import { defineConfig } from 'vite-plus'

const repoRoot = resolve(import.meta.dirname, '../..')

const config = {
  // 仅供 Vitest 编译 SFC；`vp pack` 使用下方 pack.plugins。
  plugins: [vue(), vueJsx()],
  css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } } },
  resolve: { conditions: ['veltra-dev', 'module', 'import', 'browser', 'default'] },

  run: { tasks: { build: { command: 'vp pack', cache: { output: ['dist/**'] } } } },

  test: { include: ['src/**/*.test.ts'], globals: true, environment: 'happy-dom' },

  pack: [
    {
      entry: ['src/index.ts', 'src/install.ts', 'src/style.ts', 'src/components/**/style.ts'],
      platform: 'browser',
      format: ['esm'],
      unbundle: true,
      sourcemap: true,
      clean: true,
      treeshake: {
        moduleSideEffects: [{ test: /\/components\/[^/]+\/style\.ts$/, sideEffects: true }]
      },
      deps: {
        alwaysBundle: [/^@codemirror\//, /^@lezer\//, 'style-mod', '@veltra/ofd-core'],
        onlyBundle: false,
        neverBundle: [
          'vue',
          '@veltra/utils',
          '@veltra/compositions',
          '@veltra/directives',
          '@veltra/styles',
          '@veltra/icons',
          /^@veltra\/sheet-core/,
          '@cat-kit/core',
          '@embedpdf/core',
          '@embedpdf/engines',
          '@embedpdf/plugin-document-manager',
          '@embedpdf/plugin-render',
          '@embedpdf/plugin-scroll',
          '@embedpdf/plugin-viewport',
          '@embedpdf/plugin-zoom',
          '@lexical/history',
          '@lexical/html',
          '@lexical/link',
          '@lexical/list',
          '@lexical/rich-text',
          '@lexical/selection',
          '@lexical/utils',
          'codemirror',
          'docx-preview',
          'lexical',
          'pdfjs-dist'
        ]
      },
      dts: true,
      css: {
        inject: true,
        preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } }
      },
      plugins: [unpluginVue({ isProduction: true }), unpluginVueJsx()]
    },
    // pdf worker 单文件产物：polyfill + pdf.worker 内联，供 pdf-previewer 经
    // new Worker(new URL('./pdf-worker-wrapper.js', import.meta.url)) 以相对路径加载。
    // 须在主构建（clean dist）之后执行，故 clean 关闭；pdfjs-dist 仅在 worker 侧内联，
    // 主线程仍走 neverBundle 由消费方 bundler 接管。
    {
      entry: ['src/components/file-viewer/previewers/pdf-worker-wrapper.ts'],
      platform: 'browser',
      format: ['esm'],
      unbundle: false,
      sourcemap: true,
      clean: false,
      dts: false,
      outDir: 'dist/components/file-viewer/previewers',
      outputOptions: { entryFileNames: 'pdf-worker-wrapper.js' },
      // polyfill / wrapper 是纯副作用模块（补全局 API），禁止被 treeshake 丢弃
      treeshake: {
        moduleSideEffects: [{ test: /pdf-(polyfill|worker-wrapper)/, sideEffects: true }]
      },
      deps: { alwaysBundle: [/^pdfjs-dist\//, 'pdfjs-dist'], onlyBundle: false }
    }
  ]
}

export default defineConfig(config as Parameters<typeof defineConfig>[0])
