import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/postal.ts'),
      name: 'paper-postal',
      fileName: 'paper-postal',
    },
  },
  plugins: [dts()],
})