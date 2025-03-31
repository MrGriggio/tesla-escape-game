export default {
  server: {
    port: 8080
  },
  base: '/tesla-escape-game/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
}