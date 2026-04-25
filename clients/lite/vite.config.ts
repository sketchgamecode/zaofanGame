import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 引用 web 客户端的核心逻辑（最终会迁移到 server/src/data 和 types）
      '@core': path.resolve(__dirname, '../web/src/core'),
      '@data': path.resolve(__dirname, '../web/src/data'),
    },
  },
  server: { port: 5174 },
});
