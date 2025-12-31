import { build as viteBuild } from 'vite'
import { getEntries, UI_ROOT, __dirname } from './helper'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export async function build() {
  const entries = await getEntries()

  await viteBuild({
    resolve: {
      alias: [{ find: '@ui', replacement: UI_ROOT }]
    },

    plugins: [
      vue({
        isProduction: true
      }),
      vueJsx()
    ],

    logLevel: 'warn',

    build: {
      sourcemap: true,

      outDir: resolve(__dirname, '../dist'),

      emptyOutDir: true,

      lib: {
        entry: entries,
        formats: ['es']
      },

      rollupOptions: {
        // 确保外部化处理那些你不想打包进库的依赖
        external: [
          // 核心框架
          'vue',
          '@ultra/icon',
          'cat-kit/fe',

          // CodeMirror 系列（约 400KB）
          /^codemirror/,
          /^@codemirror\//,

          // Lexical 系列（约 250KB）
          /^lexical/,
          /^@lexical\//,

          // Floating UI（约 30KB）
          /^@floating-ui\//,

          // Virtual 列表（约 20KB）
          /^@tanstack\//
        ],
        output: {
          chunkFileNames: 'venders/[name].js',

          advancedChunks: {
            groups: [
              {
                test: /@codemirror\/lang-javascript/,
                name: 'editor-lang-javascript'
              },
              {
                test: /@codemirror\/lang-sql/,
                name: 'editor-lang-sql'
              },
              {
                test: /@codemirror\/lang-java/,
                name: 'editor-lang-java'
              },
              {
                test: /@codemirror\/lang-json/,
                name: 'editor-lang-json'
              }
            ]
          }
        }
      }
    }
  })
}
