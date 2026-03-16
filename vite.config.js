import { resolve } from 'path'
import tailwindcss from "@tailwindcss/vite"

export default {
  plugins: [tailwindcss()],
  server: {
    port: 5172
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        design: resolve(__dirname, 'design.html'),
      },
    },
  },
}
