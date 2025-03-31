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
        manualChunks: undefined,
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(mp3|png|jpeg|jpg|gif|svg)$/.test(assetInfo.name)) {
            return `assets/${assetInfo.name}`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    }
  }
}