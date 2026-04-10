import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
        {
          'naive-ui': [
            'useDialog',
            'useMessage',
            'useNotification',
            'useLoadingBar',
          ],
          '@vueuse/core': [
            'useStorage',
            'useDark',
            'useToggle',
            'useDebounce',
            'useThrottle',
          ],
        },
      ],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [NaiveUiResolver()],
      dts: 'src/components.d.ts',
    }),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['@xenova/transformers', 'better-sqlite3', /^onnxruntime-node/, 'node-llama-cpp', 'node-cron'],
            },
          },
          resolve: {
            alias: {
              '@electron': path.resolve(__dirname, 'electron'),
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
        vite: {
            build: {
              rollupOptions: {
                external: ['@xenova/transformers', 'better-sqlite3', /^onnxruntime-node/, 'node-llama-cpp', 'node-cron'],
                output: {
                  format: 'esm',
                  entryFileNames: '[name].mjs',
                },
              },
            },
          },
      },
      renderer: process.env.NODE_ENV === 'test'
        ? undefined
        : {},
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
