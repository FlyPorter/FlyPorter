import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0', // 允许外部访问
    port: 5173, // 你可以指定端口号
    allowedHosts: [
      'wgh0201.synology.me', // 添加你的群晖域名
      // 如果有其他需要允许的域名，也可以添加在这里
    ],
  },
})
