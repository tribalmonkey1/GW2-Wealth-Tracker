import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
                            server: {
                              proxy: {
                                '/gw2api': {
                                  target: 'https://api.guildwars2.com',
                                  changeOrigin: true,
                                  rewrite: (path) => path.replace(/^\/gw2api/, ''),
                                }
                              }
                            }
})
